import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

export async function createQueue(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/queues',
      {
        schema: {
          tags: ['queue'],
          summary: 'Create a queue',
          security: [{ bearerAuth: [] }],
          body: z.object({
            title: z.string(),
            averageTimeInMinutes: z.number().int().positive(),
            isActive: z.boolean().default(false),
          }),
          response: {
            201: z.object({
              queueId: z.string().cuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const establishmentId = await request.getCurrentUserId()

        const { averageTimeInMinutes, isActive, title } = request.body

        const queue = await prisma.queue.create({
          data: {
            averageTimeInMinutes,
            isActive,
            title,
            establishmentId,
          },
        })

        return reply.status(201).send({ queueId: queue.id })
      },
    )
}
