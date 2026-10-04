import { WS_URL, getToken } from "./api"
import type { ServerEvent } from "../interfaces"

type Listener = (event: ServerEvent) => void

const RECONNECT_BASE = 1000
const RECONNECT_MAX = 15000
const PING_INTERVAL = 25000

class SocketClient {
  private socket: WebSocket | null = null
  private listeners = new Set<Listener>()
  private attempts = 0
  private reconnectTimer: number | null = null
  private pingTimer: number | null = null
  private closedByUs = false

  connect() {
    const token = getToken()

    if (!token || this.socket) return

    this.closedByUs = false

    const url = `${WS_URL}/ws?token=${encodeURIComponent(token)}`
    const socket = new WebSocket(url)

    this.socket = socket

    socket.addEventListener("open", () => {
      this.attempts = 0
      this.startPing()
    })

    socket.addEventListener("message", (raw) => {
      try {
        const event = JSON.parse(raw.data as string) as ServerEvent
        this.listeners.forEach((listener) => listener(event))
      } catch {
        /* ignore malformed frames */
      }
    })

    socket.addEventListener("close", () => {
      this.socket = null
      this.stopPing()

      if (!this.closedByUs) this.scheduleReconnect()
    })

    socket.addEventListener("error", () => socket.close())
  }

  disconnect() {
    this.closedByUs = true
    this.clearReconnect()
    this.stopPing()
    this.socket?.close()
    this.socket = null
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  send(payload: { type: string; channelId?: string }) {
    if (this.socket?.readyState !== WebSocket.OPEN) return false

    this.socket.send(JSON.stringify(payload))
    return true
  }

  private scheduleReconnect() {
    this.clearReconnect()

    const delay = Math.min(RECONNECT_BASE * 2 ** this.attempts, RECONNECT_MAX)
    this.attempts += 1

    this.reconnectTimer = window.setTimeout(() => this.connect(), delay)
  }

  private clearReconnect() {
    if (this.reconnectTimer === null) return
    window.clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
  }

  private startPing() {
    this.stopPing()
    this.pingTimer = window.setInterval(() => this.send({ type: "ping" }), PING_INTERVAL)
  }

  private stopPing() {
    if (this.pingTimer === null) return
    window.clearInterval(this.pingTimer)
    this.pingTimer = null
  }
}

export const socketClient = new SocketClient()