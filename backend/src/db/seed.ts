import type {
  ChannelRecord,
  MessageRecord,
} from "../models/types.ts"

export const SYSTEM_USER_ID = "system"

const channel = (
  id: string,
  name: string,
  description: string,
  emoji: string,
): ChannelRecord => ({
  id,
  name,
  description,
  emoji,
  type: id === "global" ? "global" : "group",
  createdBy: SYSTEM_USER_ID,
  members: [],
  createdAt: "2026-06-28T00:00:00.000Z",
  updatedAt: "2026-06-28T00:00:00.000Z",
})

const systemMessage = (
  id: string,
  channelId: string,
  content: string,
): MessageRecord => ({
  id,
  channelId,
  sender: SYSTEM_USER_ID,
  content,
  parentMessage: null,
  replyCount: 0,
  reactions: [],
  editedAt: null,
  createdAt: "2026-06-28T00:00:00.000Z",
})

export function createSeed() {
  return {
    users: [],
    channels: [
      channel(
        "global",
        "Global Chat",
        "The main lobby for everyone to hang out and talk about anything.",
        "🌐",
      ),
      channel(
        "tech-talk",
        "Tech Talk",
        "Share coding tips, framework debates, and the future of AI.",
        "💻",
      ),
      channel(
        "gaming",
        "Gaming Zone",
        "Co-op matchmaking, speedruns, and game recommendations.",
        "🎮",
      ),
    ],
    messages: [
      systemMessage(
        "msg_seed_welcome",
        "global",
        "Welcome to Us-APP! Join a channel on the left, or create your own to get started.",
      ),
      systemMessage(
        "msg_seed_tech",
        "tech-talk",
        "This is Tech Talk. Drop your stack, your problems, and your favourite frameworks here.",
      ),
      systemMessage(
        "msg_seed_gaming",
        "gaming",
        "This is Gaming Zone. What are you playing right now?",
      ),
    ],
    reports: [],
  }
}