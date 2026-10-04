import type { WebSocket } from "ws"

import { getStore } from "../db/store.ts"
import { canAccessChannel } from "../lib/access.ts"
import type { UserRecord } from "../models/types.ts"

export interface Client {
  connectionId: string
  socket: WebSocket
  user: UserRecord
  channels: Set<string>
}

export type ServerEvent =
  | { type: "presence"; online: string[] }
  | { type: "channel:created"; channel: unknown }
  | { type: "channel:updated"; channel: unknown }
  | { type: "channel:deleted"; channelId: string }
  | { type: "message:new"; channelId: string; message: unknown }
  | { type: "message:update"; channelId: string; message: unknown }
  | { type: "message:delete"; channelId: string; messageId: string }
  | { type: "reaction:update"; channelId: string; message: unknown }
  | { type: "typing"; channelId: string; userId: string; username: string }

class Hub {
  private readonly clients = new Map<string, Client>()

  add(connectionId: string, socket: WebSocket, user: UserRecord) {
    const client: Client = { connectionId, socket, user, channels: new Set() }
    this.clients.set(connectionId, client)
    return client
  }

  remove(connectionId: string) {
    const client = this.clients.get(connectionId)
    if (!client) return null

    this.clients.delete(connectionId)
    return client
  }

  subscribe(client: Client, channelId: string) {
    client.channels.add(channelId)
  }

  unsubscribe(client: Client, channelId: string) {
    client.channels.delete(channelId)
  }

  onlineUserIds() {
    return [...new Set([...this.clients.values()].map((client) => client.user.id))]
  }

  isOnline(userId: string) {
    for (const client of this.clients.values()) {
      if (client.user.id === userId) return true
    }
    return false
  }

  send(client: Client, event: ServerEvent) {
    if (client.socket.readyState !== client.socket.OPEN) return

    try {
      client.socket.send(JSON.stringify(event))
    } catch {
      /* client will be cleaned up on close */
    }
  }

  broadcastAll(event: ServerEvent, exceptConnectionId?: string) {
    for (const client of this.clients.values()) {
      if (client.connectionId === exceptConnectionId) continue
      this.send(client, event)
    }
  }

  broadcastToChannel(channelId: string, event: ServerEvent, exceptConnectionId?: string) {
    const channel = getStore().find("channels", channelId)

    for (const client of this.clients.values()) {
      if (client.connectionId === exceptConnectionId) continue
      if (!client.channels.has(channelId)) continue
      if (channel && !canAccessChannel(channel, client.user)) continue
      this.send(client, event)
    }
  }

  broadcastPresence() {
    this.broadcastAll({ type: "presence", online: this.onlineUserIds() })
  }
}

export const hub = new Hub()