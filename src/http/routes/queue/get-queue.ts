import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'

export async function getQueue(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/queues/:queueId',
      {
        schema: {
          tags: ['queue'],
          summary: 'Get queue by id',
          security: [{ bearerAuth: [] }],
          params: z.object({
            queueId: z.string().cuid(),
          }),
          response: {
            200: z.object({
              queue: z.object({
                id: z.string().cuid(),
                title: z.string(),
                averageTimeInMinutes: z.number().int().positive(),
                isActive: z.boolean(),
              }),
            }),
          },
        },
      },
      async (request) => {
        const establishmentId = await request.getCurrentUserId()

        const { queueId } = request.params

        const queue = await prisma.queue.findUnique({
          select: {
            id: true,
            title: true,
            averageTimeInMinutes: true,
            isActive: true,
          },
          where: {
            establishmentId,
            id: queueId,
          },
        })

        if (!queue) {
          throw new BadRequestError('Queue not found')
        }

        return { queue }
      },
    )
}
