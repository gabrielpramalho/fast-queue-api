import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { TicketStatus } from 'generated/prisma'
import z from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'

export async function markAsDone(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/tickets/:ticketId/done',
      {
        schema: {
          tags: ['tickets'],
          summary: 'Mark ticket as done',
          security: [{ bearerAuth: [] }],
          params: z.object({
            ticketId: z.string().cuid(),
          }),
          response: {
            200: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { ticketId } = request.params

        const ticket = await prisma.ticket.findUnique({
          where: { id: ticketId },
        })

        if (!ticket) {
          throw new BadRequestError('Ticket not found')
        }

        await prisma.ticket.update({
          data: {
            status: TicketStatus.DONE,
          },
          where: {
            id: ticketId,
          },
        })

        return reply.status(200).send()
      },
    )
}
