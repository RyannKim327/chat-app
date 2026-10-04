import Fastify, { type FastifyError } from "fastify"
import cors from "@fastify/cors"
import websocket from "@fastify/websocket"
import type { WebSocket } from "ws"

import { env, isProd } from "./env.ts"
import { initStore } from "./db/store.ts"
import { authPlugin } from "./plugins/auth.ts"
import { attachSocket } from "./ws/attach.ts"

import authRoutes from "./routes/auth.ts"
import channelRoutes from "./routes/channels.ts"
import messageRoutes from "./routes/messages.ts"
import moderationRoutes from "./routes/moderation.ts"
import userRoutes from "./routes/users.ts"

const app = Fastify({
  logger: { level: isProd ? "info" : "debug" },
})

await initStore(env.dbFile)

await app.register(cors, {
  // In development we reflect the caller's origin so the Vite dev server can
  // move ports freely. Production is pinned to CLIENT_URL.
  origin: isProd ? env.clientUrl : true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
})

await app.register(websocket, {
  options: { maxPayload: 64 * 1024 },
})

await app.register(authPlugin)

app.setErrorHandler((error: FastifyError, request, reply) => {
  const status = error.statusCode ?? 500

  if (status >= 500) {
    request.log.error(error)
    return reply.code(status).send({ error: "Something went wrong on our side" })
  }

  return reply.code(status).send({ error: error.message || "Bad request" })
})

app.get("/api/health", async () => ({ ok: true, db: env.dbFile }))

await app.register(
  async (api) => {
    await api.register(authRoutes)
    await api.register(channelRoutes)
    await api.register(messageRoutes)
    await api.register(moderationRoutes)
    await api.register(userRoutes)
  },
  { prefix: "/api/v1" },
)

app.get("/ws", { websocket: true }, (socket: WebSocket, request) => {
  const token = (request.query as { token?: string } | undefined)?.token

  attachSocket(socket, token)
})

await app.listen({ port: env.port, host: env.host })

app.log.info(`database: ${env.dbFile}`)