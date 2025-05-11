import fastify from 'fastify'
import { env } from './env'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import fastifyWebsocket from '@fastify/websocket'
import { createAccount } from './http/routes/auth/create-account'
import { authenticateWithPassword } from './http/routes/auth/authenticate-with-password'
import { createQueue } from './http/routes/queue/create-queue'
import { getQueues } from './http/routes/queue/get-queues'
import { getQueue } from './http/routes/queue/get-queue'
import { activateQueue } from './http/routes/queue/activate-queue'
import { createTicket } from './http/routes/tickets/create-ticket'
import { errorHandler } from './error-handler'
import { getTickets } from './http/routes/tickets/get-tickets'
import { getTicket } from './http/routes/tickets/get-ticket'
import { markAsDone } from './http/routes/tickets/mark-as-done'
import { markAsSkip } from './http/routes/tickets/mark-as-skip'
import { callNext } from './http/routes/queue/call-next'
import { createWebSocketConnection } from './ws/connection'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.register(fastifyCors, {
  origin: '*',
})

app.register(fastifyWebsocket)

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.setErrorHandler(errorHandler)

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Fast Queue API',
      description: 'Organize your queues at your establishment',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

app.register(createAccount)
app.register(authenticateWithPassword)

app.register(createQueue)
app.register(getQueues)
app.register(getQueue)
app.register(activateQueue)

app.register(createTicket)
app.register(getTickets)
app.register(getTicket)
app.register(markAsDone)
app.register(markAsSkip)

app.register(callNext)

app.register(createWebSocketConnection)

app
  .listen({
    host: '0.0.0.0',
    port: env.PORT,
  })
  .then(() => {
    console.log('🚀 HTTP Server Running!')
  })
