import type { ChannelRecord, UserRecord } from "../models/types.ts"

export function isChannelMember(channel: ChannelRecord, userId: string) {
  return channel.members.includes(userId)
}

export function canAccessChannel(channel: ChannelRecord, user: UserRecord | null) {
  if (!user) return false
  if (channel.type === "global") return true

  return isChannelMember(channel, user.id)
}