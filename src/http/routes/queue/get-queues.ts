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
                  tickets: z.number(),
                }),
              ),
            }),
          },
        },
      },
      async (request) => {
        const establishmentId = await request.getCurrentUserId()

        const allQueues = await prisma.queue.findMany({
          select: {
            id: true,
            title: true,
            averageTimeInMinutes: true,
            isActive: true,
            _count: {
              select: {
                tickets: true,
              },
            },
          },
          where: {
            establishmentId,
          },
        })

        const queues = allQueues.map((queue) => {
          return {
            id: queue.id,
            title: queue.title,
            averageTimeInMinutes: queue.averageTimeInMinutes,
            isActive: queue.isActive,
            tickets: queue._count.tickets,
          }
        })

        return { queues }
      },
    )
}
