import 'fastify'

declare module 'fastify' {
  export interface FastifyRequest {
    getCurrentUserId(): Promise<string>
  }
  export interface FastifyInstance {
    websocketServer: WebSocketServer & {
      connectionsByQueue?: Map<string, WebSocket[]>
    }
  }
}
