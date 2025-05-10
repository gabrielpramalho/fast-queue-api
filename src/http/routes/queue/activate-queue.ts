import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'

export async function activateQueue(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/queues/:queueId',
      {
        schema: {
          tags: ['queue'],
          summary: 'Activate queue',
          security: [{ bearerAuth: [] }],
          params: z.object({
            queueId: z.string().cuid(),
          }),
          body: z.object({
            isActive: z.boolean(),
          }),
          response: {
            200: z.null(),
          },
        },
      },
      async (request, reply) => {
        const establishmentId = await request.getCurrentUserId()

        const { queueId } = request.params
        const { isActive } = request.body

        const updateQueue = await prisma.queue.update({
          where: {
            id: queueId,
            establishmentId,
          },
          data: { isActive },
        })

        if (!updateQueue) {
          throw new BadRequestError('Queue not found')
        }

        return reply.status(200).send()
      },
    )
}
