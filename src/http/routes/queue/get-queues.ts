import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

export async function getQueues(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/queues',
      {
        schema: {
          tags: ['queue'],
          summary: 'Get all queues',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              queues: z.array(
                z.object({
                  id: z.string().cuid(),
                  title: z.string(),
                  averageTimeInMinutes: z.number().int().positive(),
                  isActive: z.boolean(),
                }),
              ),
            }),
          },
        },
      },
      async (request) => {
        const establishmentId = await request.getCurrentUserId()

        const queues = await prisma.queue.findMany({
          select: {
            id: true,
            title: true,
            averageTimeInMinutes: true,
            isActive: true,
          },
          where: {
            establishmentId,
          },
        })

        return { queues }
      },
    )
}
