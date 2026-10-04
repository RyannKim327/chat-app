import type { FastifyInstance } from "fastify"

import { getStore } from "../db/store.ts"
import { canAccessChannel } from "../lib/access.ts"
import { newId } from "../lib/id.ts"
import { serializeMessage } from "../models/serialize.ts"
import type { MessageRecord, UserRecord } from "../models/types.ts"
import { hub } from "../ws/hub.ts"

interface MessageBody {
  content: string
  parentMessage?: string | null
}

interface MessagesQuery {
  parent?: string
  limit?: string
}

interface ReactionBody {
  emoji: string
}

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

function canAccessMessage(
  store: ReturnType<typeof getStore>,
  message: MessageRecord,
  user: UserRecord,
) {
  const channel = store.find("channels", message.channelId)

  return channel ? canAccessChannel(channel, user) : false
}

export default async function messageRoutes(app: FastifyInstance) {
  app.get(
    "/channels/:id/messages",
    {
      preHandler: [app.requireAuth],
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            parent: { type: "string", maxLength: 64 },
            limit: { type: "string", maxLength: 4 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const query = request.query as MessagesQuery
      const store = getStore()
      const channel = store.find("channels", id)

      if (!channel) {
        return reply.code(404).send({ error: "Channel not found" })
      }

      if (!canAccessChannel(channel, request.user)) {
        return reply.code(403).send({ error: "Join this channel to read its messages" })
      }

      const limit = Math.min(
        Math.max(Number(query.limit) || DEFAULT_LIMIT, 1),
        MAX_LIMIT,
      )

      let scope = store.filter("messages", (message) => message.channelId === id)

      if (query.parent && query.parent !== "all") {
        const parent = query.parent === "root" ? null : query.parent
        scope = scope.filter((message) => message.parentMessage === parent)
      }

      const ordered = scope
        .slice()
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(-limit)

      return {
        messages: ordered.map(serializeMessage),
        parent: query.parent ?? "root",
      }
    },
  )

  app.post(
    "/channels/:id/messages",
    {
      preHandler: [app.requireAuth],
      schema: {
        body: {
          type: "object",
          required: ["content"],
          additionalProperties: false,
          properties: {
            content: { type: "string", minLength: 1, maxLength: 2000 },
            parentMessage: { type: ["string", "null"], maxLength: 64 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as MessageBody
      const store = getStore()
      const user = request.user!
      const channel = store.find("channels", id)

      if (!channel) {
        return reply.code(404).send({ error: "Channel not found" })
      }

      if (!canAccessChannel(channel, user)) {
        return reply.code(403).send({ error: "Join this channel to post messages" })
      }

      const content = body.content.trim()

      if (!content) {
        return reply.code(400).send({ error: "Message cannot be empty" })
      }

      let parent: MessageRecord | null = null

      if (body.parentMessage) {
        parent = store.find("messages", body.parentMessage) ?? null

        if (!parent || parent.channelId !== id) {
          return reply.code(400).send({ error: "You can only reply inside the same channel" })
        }
      }

      const message: MessageRecord = {
        id: newId("msg"),
        channelId: id,
        sender: user.id,
        content,
        parentMessage: parent ? parent.id : null,
        replyCount: 0,
        reactions: [],
        editedAt: null,
        createdAt: new Date().toISOString(),
      }

      await store.insert("messages", message)

      const serialized = serializeMessage(message)
      hub.broadcastToChannel(id, { type: "message:new", channelId: id, message: serialized })

      if (parent) {
        const updatedParent = serializeMessage(parent)
        hub.broadcastToChannel(id, {
          type: "message:update",
          channelId: id,
          message: updatedParent,
        })
      }

      return reply.code(201).send({ message: serialized })
    },
  )

  app.patch(
    "/messages/:id",
    {
      preHandler: [app.requireAuth],
      schema: {
        body: {
          type: "object",
          required: ["content"],
          additionalProperties: false,
          properties: {
            content: { type: "string", minLength: 1, maxLength: 2000 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as { content: string }
      const store = getStore()
      const message = store.find("messages", id)

      if (!message) {
        return reply.code(404).send({ error: "Message not found" })
      }

      if (!canAccessMessage(store, message, request.user!)) {
        return reply.code(403).send({ error: "You are not a member of this channel" })
      }

      if (message.sender !== request.user!.id && request.user!.role !== "admin") {
        return reply.code(403).send({ error: "You can only edit your own messages" })
      }

      const content = body.content.trim()

      if (!content) {
        return reply.code(400).send({ error: "Message cannot be empty" })
      }

      const updated = await store.update("messages", id, {
        content,
        editedAt: new Date().toISOString(),
      })

      const serialized = serializeMessage(updated!)
      hub.broadcastToChannel(message.channelId, {
        type: "message:update",
        channelId: message.channelId,
        message: serialized,
      })

      return { message: serialized }
    },
  )

  app.delete(
    "/messages/:id",
    { preHandler: [app.requireAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const store = getStore()
      const message = store.find("messages", id)

      if (!message) {
        return reply.code(404).send({ error: "Message not found" })
      }

      if (!canAccessMessage(store, message, request.user!)) {
        return reply.code(403).send({ error: "You are not a member of this channel" })
      }

      if (message.sender !== request.user!.id && request.user!.role !== "admin") {
        return reply.code(403).send({ error: "You can only delete your own messages" })
      }

      for (const replyMessage of store.filter(
        "messages",
        (item) => item.parentMessage === id,
      )) {
        await store.remove("messages", replyMessage.id)
      }

      await store.remove("messages", id)

      hub.broadcastToChannel(message.channelId, {
        type: "message:delete",
        channelId: message.channelId,
        messageId: id,
      })

      return reply.code(204).send()
    },
  )

  app.post(
    "/messages/:id/reactions",
    {
      preHandler: [app.requireAuth],
      schema: {
        body: {
          type: "object",
          required: ["emoji"],
          additionalProperties: false,
          properties: {
            emoji: { type: "string", minLength: 1, maxLength: 8 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as ReactionBody
      const store = getStore()
      const message = store.find("messages", id)

      if (!message) {
        return reply.code(404).send({ error: "Message not found" })
      }

      if (!canAccessMessage(store, message, request.user!)) {
        return reply.code(403).send({ error: "You are not a member of this channel" })
      }

      const userId = request.user!.id

      const updated = await store.update("messages", id, (current) => {
        const reactions = current.reactions.map((reaction) => ({ ...reaction, users: [...reaction.users] }))
        const existing = reactions.find((reaction) => reaction.emoji === body.emoji)

        if (!existing) {
          reactions.push({ emoji: body.emoji, count: 1, users: [userId] })
        } else if (existing.users.includes(userId)) {
          existing.users = existing.users.filter((user) => user !== userId)
          existing.count = existing.users.length
        } else {
          existing.users.push(userId)
          existing.count = existing.users.length
        }

        return { reactions: reactions.filter((reaction) => reaction.count > 0) }
      })

      const serialized = serializeMessage(updated!)
      hub.broadcastToChannel(message.channelId, {
        type: "reaction:update",
        channelId: message.channelId,
        message: serialized,
      })

      return { message: serialized }
    },
  )
}