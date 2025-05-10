import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { TicketStatus } from 'generated/prisma'

export async function createTicket(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/queues/:queueId/tickets',
    {
      schema: {
        tags: ['tickets'],
        summary: 'Create a new ticket',
        params: z.object({
          queueId: z.string().cuid(),
        }),
        201: z.object({
          ticketId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { queueId } = request.params

      const queue = await prisma.queue.findUnique({
        where: {
          id: queueId,
        },
      })

      if (!queue) {
        throw new BadRequestError('Queue not found')
      }

      if (!queue.isActive) {
        throw new BadRequestError('Queue is not active')
      }

      const lastTicket = await prisma.ticket.findFirst({
        where: {
          queueId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      const number = lastTicket ? String(Number(lastTicket.number) + 1) : '1'

      const ticket = await prisma.ticket.create({
        data: {
          status: TicketStatus.WAITING,
          queueId,
          number,
        },
      })

      return reply.status(201).send({ ticketId: ticket.id })
    },
  )
}
