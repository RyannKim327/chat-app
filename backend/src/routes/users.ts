import type { FastifyInstance } from "fastify"

import { getStore } from "../db/store.ts"
import { toPublicUser } from "../lib/auth.ts"
import { hub } from "../ws/hub.ts"

function withPresence<T extends { id: string; status: string }>(user: T): T & { online: boolean } {
  return { ...user, online: hub.isOnline(user.id) }
}

export default async function userRoutes(app: FastifyInstance) {
  app.get("/users", { preHandler: [app.optionalAuth] }, async (request) => {
    const store = getStore()

    return {
      users: store
        .all("users")
        .map((user) => withPresence(toPublicUser(user)))
        .sort((a, b) => a.username.localeCompare(b.username)),
    }
  })

  app.get("/users/online", async () => {
    const store = getStore()

    const users = store
      .all("users")
      .filter((user) => hub.isOnline(user.id))
      .map((user) => withPresence(toPublicUser(user)))
      .sort((a, b) => a.username.localeCompare(b.username))

    return { users, ids: users.map((user) => user.id) }
  })
}