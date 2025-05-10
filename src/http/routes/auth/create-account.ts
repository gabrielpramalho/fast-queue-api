import { hash } from 'bcryptjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'
import { generateSlug } from '@/utils/generate-slug'

export async function createAccount(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/establishments',
    {
      schema: {
        tags: ['auth'],
        summary: 'Create a new account',
        body: z.object({
          name: z.string(),
          email: z.string().email(),
          password: z.string().min(6),
        }),
      },
    },
    async (request, reply) => {
      const { email, name, password } = request.body

      const establishmentWithSameEmail = await prisma.establishment.findUnique({
        where: {
          email,
        },
      })

      if (establishmentWithSameEmail) {
        throw new BadRequestError(
          'Establishment with this email already exists.',
        )
      }

      const slug = generateSlug(name)

      const establishmentWithSameSlug = await prisma.establishment.findUnique({
        where: {
          slug,
        },
      })

      if (establishmentWithSameSlug) {
        throw new BadRequestError(
          'Establishment with this slug already exists.',
        )
      }

      const passwordHash = await hash(password, 6)

      await prisma.establishment.create({
        data: {
          name,
          email,
          slug,
          passwordHash,
        },
      })

      return reply.status(201).send()
    },
  )
}
