import { getStore } from "../db/store.ts"
import { SYSTEM_USER_ID } from "../db/seed.ts"
import type {
  ChannelRecord,
  MessageRecord,
  PublicChannel,
  PublicMessage,
  PublicReport,
  PublicUser,
  ReportRecord,
} from "./types.ts"

const SYSTEM_USER: PublicUser = {
  id: SYSTEM_USER_ID,
  username: "System",
  avatar: "⚙️",
  role: "admin",
  status: "online",
  statusText: "Automated announcements",
  createdAt: "2026-06-28T00:00:00.000Z",
  updatedAt: "2026-06-28T00:00:00.000Z",
}

export function serializeUser(id: string): PublicUser | null {
  if (id === SYSTEM_USER_ID) return SYSTEM_USER

  const user = getStore().find("users", id)
  if (!user) return null

  const { password: _password, ...rest } = user
  return rest
}

export function serializeChannel(
  channel: ChannelRecord,
  viewerId?: string,
): PublicChannel {
  return {
    ...channel,
    memberCount: channel.members.length,
    joined: viewerId ? channel.members.includes(viewerId) : false,
  }
}

export function serializeMessage(message: MessageRecord): PublicMessage {
  return {
    ...message,
    replyCount: getStore().filter(
      "messages",
      (candidate) => candidate.parentMessage === message.id,
    ).length,
    sender: serializeUser(message.sender) ?? SYSTEM_USER,
  }
}

export function serializeReport(report: ReportRecord): PublicReport {
  const stored = getStore().find("messages", report.messageId)

  return {
    ...report,
    reporter: serializeUser(report.reporter) ?? SYSTEM_USER,
    message: stored ? serializeMessage(stored) : null,
  }
}