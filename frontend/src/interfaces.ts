export type Role = "admin" | "member"

export type Presence = "online" | "away" | "offline"

export interface User {
  id: string
  username: string
  avatar: string
  role: Role
  status: Presence
  statusText?: string
  online?: boolean
  createdAt: string
  updatedAt: string
}

export type ChannelType = "global" | "group"

export interface Channel {
  id: string
  name: string
  description: string
  emoji: string
  type: ChannelType
  createdBy: string
  members: string[]
  memberCount: number
  joined: boolean
  createdAt: string
  updatedAt: string
}

export interface Reaction {
  emoji: string
  count: number
  users: string[]
}

export interface Message {
  id: string
  channelId: string
  sender: User
  content: string
  parentMessage: string | null
  replyCount: number
  reactions: Reaction[]
  editedAt: string | null
  createdAt: string
}

export interface Report {
  id: string
  messageId: string
  channelId: string
  reporter: User
  reason: string
  resolved: boolean
  createdAt: string
  message: Message | null
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ServerEvent {
  type:
    | "presence"
    | "channel:created"
    | "channel:updated"
    | "channel:deleted"
    | "message:new"
    | "message:update"
    | "message:delete"
    | "reaction:update"
    | "typing"
  online?: string[]
  channel?: Channel
  channelId?: string
  messageId?: string
  message?: Message
  userId?: string
  username?: string
}