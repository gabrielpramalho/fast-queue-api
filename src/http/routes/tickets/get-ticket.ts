import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { TicketStatus } from 'generated/prisma'
import z from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'

export async function getTicket(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/queues/:queueId/tickets/:ticketId',
      {
        schema: {
          tags: ['tickets'],
          summary: 'Get ticket by id',
          security: [{ bearerAuth: [] }],
          params: z.object({
            queueId: z.string().cuid(),
            ticketId: z.string().cuid(),
          }),
          response: {
            200: z.object({
              ticket: z.object({
                id: z.string().cuid(),
                number: z.string(),
                status: z.nativeEnum(TicketStatus),
              }),
              averageToBeCalled: z.number(),
            }),
          },
        },
      },
      async (request) => {
        const { queueId, ticketId } = request.params

        const queue = await prisma.queue.findUnique({
          where: {
            id: queueId,
          },
        })

        if (!queue) {
          throw new BadRequestError('Queue not found')
        }

        const ticket = await prisma.ticket.findUnique({
          where: {
            queueId,
            id: ticketId,
          },
          select: {
            id: true,
            number: true,
            status: true,
          },
        })

        if (!ticket) {
          throw new BadRequestError('Ticket not found')
        }

        const ticketsAbove = await prisma.ticket.findMany({
          where: {
            queueId,
            status: TicketStatus.WAITING,
            number: {
              lt: ticket.number,
            },
          },
        })

        const quantityTickets = ticketsAbove.length

        const averageToBeCalled = queue.averageTimeInMinutes * quantityTickets

        return { ticket, averageToBeCalled }
      },
    )
}
