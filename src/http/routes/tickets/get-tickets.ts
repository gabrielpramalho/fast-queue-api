import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { TicketStatus } from 'generated/prisma'
import z from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'

export async function getTickets(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/queues/:queueId/tickets',
      {
        schema: {
          tags: ['tickets'],
          summary: 'Get all tickets',
          security: [{ bearerAuth: [] }],
          params: z.object({
            queueId: z.string().cuid(),
          }),
          response: {
            200: z.object({
              tickets: z.array(
                z.object({
                  id: z.string().cuid(),
                  number: z.string(),
                  status: z.nativeEnum(TicketStatus),
                }),
              ),
            }),
          },
        },
      },
      async (request) => {
        const { queueId } = request.params

        const queue = await prisma.queue.findUnique({
          where: {
            id: queueId,
          },
        })

        if (!queue) {
          throw new BadRequestError('Queue not found')
        }

        const tickets = await prisma.ticket.findMany({
          where: {
            queueId,
          },
          select: {
            id: true,
            number: true,
            status: true,
          },
        })

        return { tickets }
      },
    )
}
