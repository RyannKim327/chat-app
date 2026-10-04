import type { FastifyReply, FastifyRequest } from "fastify"
import fp from "fastify-plugin"

import { verifyToken } from "../lib/auth.ts"
import { getStore } from "../db/store.ts"
import type { UserRecord } from "../models/types.ts"

declare module "fastify" {
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    optionalAuth: (request: FastifyRequest) => Promise<void>
  }

  interface FastifyRequest {
    user: UserRecord | null
  }
}

function readUser(request: FastifyRequest): UserRecord | null {
  const header = request.headers.authorization

  if (!header?.startsWith("Bearer ")) return null

  const payload = verifyToken(header.slice(7).trim())

  if (!payload) return null

  return getStore().find("users", payload.sub) ?? null
}

export const authPlugin = fp(async (app) => {
  app.decorateRequest("user", null)

  app.decorate("requireAuth", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = readUser(request)

    if (!user) {
      await reply.code(401).send({ error: "Authentication required" })
      return
    }

    request.user = user
  })

  app.decorate("optionalAuth", async (request: FastifyRequest) => {
    request.user = readUser(request)
  })
})

export function isAdmin(request: FastifyRequest) {
  return request.user?.role === "admin"
}