export type Role = "admin" | "member"

export type Presence = "online" | "away" | "offline"

export interface UserRecord {
  id: string
  username: string
  password: string
  avatar: string
  role: Role
  status: Presence
  statusText?: string
  createdAt: string
  updatedAt: string
}

export type PublicUser = Omit<UserRecord, "password">

export type ChannelType = "global" | "group"

export interface ChannelRecord {
  id: string
  name: string
  description: string
  emoji: string
  type: ChannelType
  createdBy: string
  members: string[]
  createdAt: string
  updatedAt: string
}

export interface Reaction {
  emoji: string
  count: number
  users: string[]
}

export interface MessageRecord {
  id: string
  channelId: string
  sender: string
  content: string
  parentMessage: string | null
  replyCount: number
  reactions: Reaction[]
  editedAt: string | null
  createdAt: string
}

export interface ReportRecord {
  id: string
  messageId: string
  channelId: string
  reporter: string
  reason: string
  resolved: boolean
  createdAt: string
}

export interface PublicMessage extends Omit<MessageRecord, "sender"> {
  sender: PublicUser
  replyCount: number
}

export interface PublicChannel extends Omit<ChannelRecord, "members"> {
  memberCount: number
  members: string[]
  joined: boolean
}

export interface PublicReport extends Omit<ReportRecord, "reporter"> {
  reporter: PublicUser
  message: PublicMessage | null
}