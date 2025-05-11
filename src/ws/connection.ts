import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { TicketStatus } from 'generated/prisma'
import z from 'zod'

export async function createWebSocketConnection(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/ws/:queueId',
    {
      schema: {
        tags: ['ws'],
        summary: 'WS',
        params: z.object({
          queueId: z.string().cuid(),
        }),
      },
      websocket: true,
    },
    async (connection, request) => {
      const { queueId } = request.params

      const hasQueue = await prisma.queue.findUnique({
        where: { id: queueId },
      })

      if (!hasQueue) {
        connection.close()
        console.error(`Fila com ID ${queueId} não encontrada. Conexão fechada.`)
        return
      }

      const lastTicket = await prisma.ticket.findFirst({
        where: {
          queueId: hasQueue.id,
          status: TicketStatus.CALLED,
        },
        orderBy: {
          number: 'desc',
        },
      })

      connection.send(
        JSON.stringify({
          type: 'currentNumber',
          number: lastTicket?.number,
        }),
      )

      if (!app.websocketServer.connectionsByQueue) {
        app.websocketServer.connectionsByQueue = new Map<string, WebSocket[]>()
      }

      if (!app.websocketServer.connectionsByQueue.has(queueId)) {
        app.websocketServer.connectionsByQueue.set(queueId, [])
      }

      app.websocketServer.connectionsByQueue.get(queueId)?.push(connection)

      connection.on('message', () => {
        connection.send(
          JSON.stringify({
            type: 'currentNumber',
            number: lastTicket?.number,
          }),
        )
      })

      connection.on('close', () => {
        console.log(`Conexão WebSocket fechada para a fila ${queueId}`)

        const connections = app.websocketServer.connectionsByQueue?.get(queueId)
        if (connections) {
          const index = connections.indexOf(connection)
          if (index > -1) {
            connections.splice(index, 1)
          }
          if (connections.length === 0) {
            app.websocketServer.connectionsByQueue?.delete(queueId)
          }
        }
      })
    },
  )
}
