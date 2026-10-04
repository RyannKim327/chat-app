import type { WebSocket } from "ws"

import { getStore } from "../db/store.ts"
import { canAccessChannel } from "../lib/access.ts"
import { verifyToken } from "../lib/auth.ts"
import { newId } from "../lib/id.ts"
import { hub } from "./hub.ts"

interface ClientCommand {
  type: "subscribe" | "unsubscribe" | "typing" | "ping"
  channelId?: string
}

function parse(raw: unknown): ClientCommand | null {
  try {
    const parsed = JSON.parse(String(raw)) as ClientCommand

    if (
      parsed?.type === "subscribe" ||
      parsed?.type === "unsubscribe" ||
      parsed?.type === "typing" ||
      parsed?.type === "ping"
    ) {
      return parsed
    }

    return null
  } catch {
    return null
  }
}

export function attachSocket(socket: WebSocket, token: string | undefined) {
  const store = getStore()
  const payload = token ? verifyToken(token) : null
  const user = payload ? store.find("users", payload.sub) : undefined

  if (!user) {
    socket.close(4401, "Authentication required")
    return
  }

  const connectionId = newId("con")
  const client = hub.add(connectionId, socket, user)

  hub.broadcastPresence()

  socket.on("message", (raw) => {
    const command = parse(raw)

    if (!command || !command.channelId) {
      if (command?.type === "ping") {
        hub.send(client, { type: "presence", online: hub.onlineUserIds() })
      }
      return
    }

    const channel = store.find("channels", command.channelId)

    if (!channel || !canAccessChannel(channel, user)) return

    if (command.type === "subscribe") {
      hub.subscribe(client, command.channelId)
      return
    }

    if (command.type === "unsubscribe") {
      hub.unsubscribe(client, command.channelId)
      return
    }

    hub.broadcastToChannel(
      command.channelId,
      {
        type: "typing",
        channelId: command.channelId,
        userId: user.id,
        username: user.username,
      },
      connectionId,
    )
  })

  socket.on("close", () => {
    hub.remove(connectionId)
    hub.broadcastPresence()
  })

  socket.on("error", () => {
    hub.remove(connectionId)
    hub.broadcastPresence()
  })
}