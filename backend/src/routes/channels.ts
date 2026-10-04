import type { FastifyInstance } from "fastify"

import { getStore } from "../db/store.ts"
import { SYSTEM_USER_ID } from "../db/seed.ts"
import { canAccessChannel } from "../lib/access.ts"
import { newId, slugify } from "../lib/id.ts"
import { serializeChannel, serializeUser } from "../models/serialize.ts"
import type { ChannelRecord } from "../models/types.ts"
import { hub } from "../ws/hub.ts"

interface ChannelBody {
  name: string
  description?: string
  emoji?: string
}

interface ChannelPatch {
  name?: string
  description?: string
  emoji?: string
}

function canManage(request: { user: { id: string; role: string } | null }, channel: ChannelRecord) {
  if (!request.user) return false
  return request.user.role === "admin" || channel.createdBy === request.user.id
}

export default async function channelRoutes(app: FastifyInstance) {
  app.get("/channels", { preHandler: [app.optionalAuth] }, async (request) => {
    const viewerId = request.user?.id

    return {
      channels: getStore()
        .all("channels")
        .map((channel) => serializeChannel(channel, viewerId)),
    }
  })

  app.post(
    "/channels",
    {
      preHandler: [app.requireAuth],
      schema: {
        body: {
          type: "object",
          required: ["name"],
          additionalProperties: false,
          properties: {
            name: { type: "string", minLength: 3, maxLength: 32 },
            description: { type: "string", maxLength: 240 },
            emoji: { type: "string", maxLength: 8 },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as ChannelBody
      const store = getStore()
      const userId = request.user!.id

      const slug = slugify(body.name)

      if (!slug) {
        return reply.code(400).send({ error: "Channel name needs letters or numbers" })
      }

      const duplicate = store.findBy("channels", (channel) =>
        slugify(channel.name) === slug,
      )

      if (duplicate) {
        return reply.code(409).send({ error: "A channel with that name already exists" })
      }

      const now = new Date().toISOString()

      const channel: ChannelRecord = {
        id: newId("chn"),
        name: body.name.trim(),
        description: body.description?.trim() || "No description yet.",
        emoji: body.emoji?.trim() || "💬",
        type: "group",
        createdBy: userId,
        members: [userId],
        createdAt: now,
        updatedAt: now,
      }

      await store.insert("channels", channel)
      await store.insert("messages", {
        id: newId("msg"),
        channelId: channel.id,
        sender: SYSTEM_USER_ID,
        content: `${request.user!.username} created #${channel.name}. Welcome! 🎉`,
        parentMessage: null,
        replyCount: 0,
        reactions: [],
        editedAt: null,
        createdAt: now,
      })

      const serialized = serializeChannel(channel, userId)
      hub.broadcastAll({ type: "channel:created", channel: serialized })

      return reply.code(201).send({ channel: serialized })
    },
  )

  app.get("/channels/:id", { preHandler: [app.optionalAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const channel = getStore().find("channels", id)

    if (!channel) {
      return reply.code(404).send({ error: "Channel not found" })
    }

    return { channel: serializeChannel(channel, request.user?.id) }
  })

  app.patch(
    "/channels/:id",
    {
      preHandler: [app.requireAuth],
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          minProperties: 1,
          properties: {
            name: { type: "string", minLength: 3, maxLength: 32 },
            description: { type: "string", maxLength: 240 },
            emoji: { type: "string", maxLength: 8 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as ChannelPatch
      const store = getStore()
      const channel = store.find("channels", id)

      if (!channel) {
        return reply.code(404).send({ error: "Channel not found" })
      }

      if (!canManage(request, channel)) {
        return reply.code(403).send({ error: "You cannot edit this channel" })
      }

      if (body.name && body.name.trim() !== channel.name) {
        const slug = slugify(body.name)

        if (!slug) {
          return reply.code(400).send({ error: "Channel name needs letters or numbers" })
        }

        const duplicate = store.findBy(
          "channels",
          (candidate) =>
            candidate.id !== id && slugify(candidate.name) === slug,
        )

        if (duplicate) {
          return reply.code(409).send({ error: "A channel with that name already exists" })
        }

        body.name = body.name.trim()
      }

      const updated = await store.update("channels", id, body)
      const serialized = serializeChannel(updated!, request.user!.id)
      hub.broadcastAll({ type: "channel:updated", channel: serialized })

      return { channel: serialized }
    },
  )

  app.delete(
    "/channels/:id",
    { preHandler: [app.requireAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const store = getStore()
      const channel = store.find("channels", id)

      if (!channel) {
        return reply.code(404).send({ error: "Channel not found" })
      }

      if (!canManage(request, channel)) {
        return reply.code(403).send({ error: "You cannot delete this channel" })
      }

      for (const message of store.filter("messages", (item) => item.channelId === id)) {
        await store.remove("messages", message.id)
      }

      await store.remove("channels", id)
      hub.broadcastAll({ type: "channel:deleted", channelId: id })

      return reply.code(204).send()
    },
  )

  app.post(
    "/channels/:id/join",
    { preHandler: [app.requireAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const store = getStore()
      const channel = store.find("channels", id)

      if (!channel) {
        return reply.code(404).send({ error: "Channel not found" })
      }

      const userId = request.user!.id

      if (!channel.members.includes(userId)) {
        const updated = await store.update("channels", id, (current) => ({
          members: [...current.members, userId],
        }))

        const serialized = serializeChannel(updated!, userId)
        hub.broadcastAll({ type: "channel:updated", channel: serialized })

        return reply.code(200).send({ channel: serialized })
      }

      return { channel: serializeChannel(channel, userId) }
    },
  )

  app.post(
    "/channels/:id/leave",
    { preHandler: [app.requireAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const store = getStore()
      const channel = store.find("channels", id)

      if (!channel) {
        return reply.code(404).send({ error: "Channel not found" })
      }

      if (channel.type === "global") {
        return reply.code(400).send({ error: "You cannot leave the global channel" })
      }

      const userId = request.user!.id

      if (channel.members.includes(userId)) {
        const updated = await store.update("channels", id, (current) => ({
          members: current.members.filter((member) => member !== userId),
        }))

        const serialized = serializeChannel(updated!, userId)
        hub.broadcastAll({ type: "channel:updated", channel: serialized })

        return reply.code(200).send({ channel: serialized })
      }

      return { channel: serializeChannel(channel, userId) }
    },
  )

  app.get("/channels/:id/members", { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const store = getStore()
    const channel = store.find("channels", id)

    if (!channel) {
      return reply.code(404).send({ error: "Channel not found" })
    }

    if (!canAccessChannel(channel, request.user)) {
      return reply.code(403).send({ error: "Join this channel to see its members" })
    }

    const members = channel.members
      .map((memberId) => serializeUser(memberId))
      .filter((member): member is NonNullable<typeof member> => member !== null)

    return { members }
  })
}