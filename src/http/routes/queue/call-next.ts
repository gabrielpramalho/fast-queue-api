import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { TicketStatus } from 'generated/prisma'
import { OPEN } from 'ws'

export async function callNext(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/queues/:queueId/next',
      {
        schema: {
          tags: ['queue'],
          summary: 'Call next ticket',
          security: [{ bearerAuth: [] }],
          params: z.object({
            queueId: z.string().cuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { queueId } = request.params

        const firstTicket = await prisma.ticket.findFirst({
          where: {
            queueId,
            status: TicketStatus.WAITING,
          },
        })

        if (!firstTicket) {
          throw new BadRequestError('Does not exist tickets at this queue')
        }

        await prisma.ticket.update({
          data: {
            status: TicketStatus.CALLED,
            calledAt: new Date(),
          },
          where: {
            id: firstTicket.id,
          },
        })

        const connections = app.websocketServer.connectionsByQueue?.get(queueId)

        if (connections) {
          connections.forEach((socket: WebSocket) => {
            if (socket.readyState === OPEN) {
              socket.send(
                JSON.stringify({
                  type: 'newTicketCalled',
                  ticket: {
                    id: firstTicket.id,
                    number: firstTicket.number,
                    queueId: firstTicket.queueId,
                    status: firstTicket.status,
                    calledAt: firstTicket.calledAt,
                  },
                }),
              )
            }
          })
        }

        return reply.status(204).send()
      },
    )
}
