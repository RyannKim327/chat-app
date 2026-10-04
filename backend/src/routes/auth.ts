import type { FastifyInstance } from "fastify"

import avatars from "../data/avatars.ts"
import { getStore } from "../db/store.ts"
import { hashPassword, signToken, toPublicUser, verifyPassword } from "../lib/auth.ts"
import { newId } from "../lib/id.ts"
import type { UserRecord } from "../models/types.ts"

interface RegisterBody {
  username: string
  password: string
  avatar: string
}

interface LoginBody {
  username: string
  password: string
}

const usernameRule = { minLength: 3, maxLength: 24, pattern: "^[a-zA-Z0-9_-]+$" }

export default async function authRoutes(app: FastifyInstance) {
  app.post(
    "/auth/register",
    {
      schema: {
        body: {
          type: "object",
          required: ["username", "password", "avatar"],
          additionalProperties: false,
          properties: {
            username: { type: "string", ...usernameRule },
            password: { type: "string", minLength: 6, maxLength: 128 },
            avatar: { type: "string", enum: [...avatars] },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as RegisterBody
      const store = getStore()

      const taken = store.findBy("users", (user) =>
        user.username.toLowerCase() === body.username.toLowerCase(),
      )

      if (taken) {
        return reply.code(409).send({ error: "That username is already taken" })
      }

      const now = new Date().toISOString()
      const isFirstUser = store.all("users").length === 0

      const user: UserRecord = {
        id: newId("usr"),
        username: body.username,
        password: await hashPassword(body.password),
        avatar: body.avatar,
        role: isFirstUser ? "admin" : "member",
        status: "online",
        statusText: "Hey there! I am using Us-APP.",
        createdAt: now,
        updatedAt: now,
      }

      await store.insert("users", user)

      // Everyone lands in the global lobby, so drop them straight into a room
      // they are allowed to post in.
      const lobby = store.find("channels", "global")

      if (lobby) {
        await store.update("channels", lobby.id, (current) => ({
          members: current.members.includes(user.id)
            ? current.members
            : [...current.members, user.id],
        }))
      }

      return reply.code(201).send({
        token: signToken(user),
        user: toPublicUser(user),
      })
    },
  )

  app.post(
    "/auth/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["username", "password"],
          additionalProperties: false,
          properties: {
            username: { type: "string", minLength: 1, maxLength: 64 },
            password: { type: "string", minLength: 1, maxLength: 128 },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as LoginBody
      const store = getStore()

      const user = store.findBy("users", (candidate) =>
        candidate.username.toLowerCase() === body.username.toLowerCase(),
      )

      if (!user || !(await verifyPassword(body.password, user.password))) {
        return reply.code(401).send({ error: "Wrong username or password" })
      }

      const online = await store.update("users", user.id, {
        status: "online",
      })

      return {
        token: signToken(online ?? user),
        user: toPublicUser(online ?? user),
      }
    },
  )

  app.get("/auth/me", { preHandler: [app.requireAuth] }, async (request) => ({
    user: toPublicUser(request.user!),
  }))

  app.get("/avatars", async () => avatars)
}