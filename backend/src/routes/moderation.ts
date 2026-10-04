import type { FastifyInstance } from "fastify"

import { getStore } from "../db/store.ts"
import { canAccessChannel } from "../lib/access.ts"
import { serializeReport } from "../models/serialize.ts"
import { newId } from "../lib/id.ts"
import type { ReportRecord } from "../models/types.ts"

interface ReportBody {
  reason: string
}

export default async function moderationRoutes(app: FastifyInstance) {
  app.post(
    "/messages/:id/reports",
    {
      preHandler: [app.requireAuth],
      schema: {
        body: {
          type: "object",
          required: ["reason"],
          additionalProperties: false,
          properties: {
            reason: { type: "string", minLength: 3, maxLength: 280 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as ReportBody
      const store = getStore()
      const message = store.find("messages", id)

      if (!message) {
        return reply.code(404).send({ error: "Message not found" })
      }

      const channel = store.find("channels", message.channelId)

      if (!channel || !canAccessChannel(channel, request.user)) {
        return reply.code(403).send({ error: "You are not a member of this channel" })
      }

      const reporter = request.user!.id

      if (message.sender === reporter) {
        return reply.code(400).send({ error: "You cannot report your own message" })
      }

      const existing = store.findBy("reports", (report) =>
        report.messageId === id && report.reporter === reporter,
      )

      if (existing) {
        return reply.code(409).send({ error: "You already reported this message" })
      }

      const report: ReportRecord = {
        id: newId("rpt"),
        messageId: id,
        channelId: message.channelId,
        reporter,
        reason: body.reason.trim(),
        resolved: false,
        createdAt: new Date().toISOString(),
      }

      await store.insert("reports", report)

      return reply.code(201).send({ report: serializeReport(report) })
    },
  )

  app.get("/reports", { preHandler: [app.requireAuth] }, async (request, reply) => {
    if (request.user!.role !== "admin") {
      return reply.code(403).send({ error: "Only admins can view reports" })
    }

    const store = getStore()
    const channelId = (request.query as { channelId?: string }).channelId

    let reports = store.all("reports")

    if (channelId) {
      reports = reports.filter((report) => report.channelId === channelId)
    }

    reports = reports.filter((report) => {
      const channel = store.find("channels", report.channelId)

      return channel ? canAccessChannel(channel, request.user) : false
    })

    return {
      reports: reports
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(serializeReport),
    }
  })

  app.post(
    "/reports/:id/resolve",
    { preHandler: [app.requireAuth] },
    async (request, reply) => {
      if (request.user!.role !== "admin") {
        return reply.code(403).send({ error: "Only admins can resolve reports" })
      }

      const { id } = request.params as { id: string }
      const store = getStore()
      const report = store.find("reports", id)

      if (!report) {
        return reply.code(404).send({ error: "Report not found" })
      }

      const updated = await store.update("reports", id, { resolved: true })

      return { report: serializeReport(updated!) }
    },
  )

  app.delete(
    "/reports/:id",
    { preHandler: [app.requireAuth] },
    async (request, reply) => {
      if (request.user!.role !== "admin") {
        return reply.code(403).send({ error: "Only admins can delete reports" })
      }

      const { id } = request.params as { id: string }

      if (!(await getStore().remove("reports", id))) {
        return reply.code(404).send({ error: "Report not found" })
      }

      return reply.code(204).send()
    },
  )
}