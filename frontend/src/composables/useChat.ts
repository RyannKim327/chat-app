import { computed, ref } from "vue"

import { api, errorMessage } from "../lib/api"
import { socketClient } from "../lib/socket"
import { useAuth } from "./useAuth"
import type { Channel, Message, Report, User } from "../interfaces"

const channels = ref<Channel[]>([])
const users = ref<User[]>([])
const onlineIds = ref<string[]>([])
const messages = ref<Message[]>([])
const threadMessages = ref<Message[]>([])
const activeChannelId = ref<string>("global")
const activeParentId = ref<string | null>(null)
const typingUsers = ref<Record<string, string[]>>({})
const pendingIds = ref<string[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

let unsubscribe: (() => void) | null = null
let typingSentAt = 0

const TYPING_TIMEOUT = 4000

function upsertMessage(list: Message[], message: Message) {
  const index = list.findIndex((item) => item.id === message.id)

  if (index === -1) list.push(message)
  else list.splice(index, 1, message)
}

function dropMessage(list: Message[], id: string) {
  const index = list.findIndex((item) => item.id === id)
  if (index !== -1) list.splice(index, 1)
}

export function useChat() {
  const { currentUser } = useAuth()

  const activeChannel = computed(
    () => channels.value.find((channel) => channel.id === activeChannelId.value) ?? null,
  )

  const threadParent = computed(() =>
    activeParentId.value
      ? (messages.value.find((item) => item.id === activeParentId.value) ?? null)
      : null,
  )

  const visibleMessages = computed(() =>
    activeParentId.value ? threadMessages.value : messages.value,
  )

  const onlineUsers = computed(() =>
    users.value.filter((user) => onlineIds.value.includes(user.id)),
  )

  const isMember = computed(() => activeChannel.value?.joined ?? false)

  const canAccess = computed(() => {
    const channel = activeChannel.value

    if (!channel) return false

    return channel.type === "global" || channel.joined
  })

  function canManage(channel: Channel) {
    if (!currentUser.value) return false
    return (
      currentUser.value.role === "admin" || channel.createdBy === currentUser.value.id
    )
  }

  async function loadChannels() {
    try {
      const { data } = await api.get<{ channels: Channel[] }>("/channels")
      channels.value = data.channels
      error.value = null
    } catch (err) {
      error.value = errorMessage(err, "Could not load channels")
    }
  }

  async function loadUsers() {
    try {
      const { data } = await api.get<{ users: User[] }>("/users")
      users.value = data.users
    } catch {
      /* the user list is decorative, ignore failures */
    }
  }

  async function loadMessages(channelId = activeChannelId.value, parent = "root") {
    loading.value = true

    const channel = channels.value.find((item) => item.id === channelId)

    if (channel && channel.type !== "global" && !channel.joined) {
      if (parent === "root") messages.value = []
      else threadMessages.value = []

      error.value = null
      loading.value = false
      return
    }

    try {
      const { data } = await api.get<{ messages: Message[] }>(
        `/channels/${channelId}/messages`,
        { params: { parent } },
      )

      if (parent === "root") messages.value = data.messages
      else threadMessages.value = data.messages

      error.value = null
    } catch (err) {
      error.value = errorMessage(err, "Could not load messages")
    } finally {
      loading.value = false
    }
  }

  async function selectChannel(channelId: string) {
    activeChannelId.value = channelId
    activeParentId.value = null
    threadMessages.value = []
    messages.value = []

    socketClient.send({ type: "subscribe", channelId })

    await loadMessages(channelId, "root")
  }

  async function openThread(messageId: string | null) {
    activeParentId.value = messageId

    if (!messageId) {
      threadMessages.value = []
      return
    }

    threadMessages.value = []
    await loadMessages(activeChannelId.value, messageId)
  }

  function replaceChannel(channel: Channel) {
    const index = channels.value.findIndex((item) => item.id === channel.id)

    if (index === -1) channels.value.push(channel)
    else channels.value.splice(index, 1, channel)
  }

  async function createChannel(name: string, description: string, emoji: string) {
    try {
      const { data } = await api.post<{ channel: Channel }>("/channels", {
        name,
        description,
        emoji,
      })

      replaceChannel(data.channel)
      await selectChannel(data.channel.id)

      return { success: true as const, channel: data.channel }
    } catch (err) {
      return { success: false as const, error: errorMessage(err) }
    }
  }

  async function updateChannel(channelId: string, patch: Partial<Channel>) {
    try {
      const { data } = await api.patch<{ channel: Channel }>(`/channels/${channelId}`, patch)
      replaceChannel(data.channel)
      return { success: true as const }
    } catch (err) {
      return { success: false as const, error: errorMessage(err) }
    }
  }

  async function deleteChannel(channelId: string) {
    try {
      await api.delete(`/channels/${channelId}`)

      channels.value = channels.value.filter((channel) => channel.id !== channelId)

      if (activeChannelId.value === channelId) {
        const fallback = channels.value[0]
        if (fallback) await selectChannel(fallback.id)
      }

      return { success: true as const }
    } catch (err) {
      return { success: false as const, error: errorMessage(err) }
    }
  }

  async function joinChannel(channelId: string) {
    try {
      const { data } = await api.post<{ channel: Channel }>(`/channels/${channelId}/join`)
      replaceChannel(data.channel)

      if (channelId === activeChannelId.value) {
        socketClient.send({ type: "subscribe", channelId })
        await loadMessages(channelId, "root")
      }

      return { success: true as const }
    } catch (err) {
      return { success: false as const, error: errorMessage(err) }
    }
  }

  async function leaveChannel(channelId: string) {
    try {
      const { data } = await api.post<{ channel: Channel }>(`/channels/${channelId}/leave`)
      replaceChannel(data.channel)

      socketClient.send({ type: "unsubscribe", channelId })
      activeParentId.value = null
      threadMessages.value = []
      messages.value = []

      return { success: true as const }
    } catch (err) {
      return { success: false as const, error: errorMessage(err) }
    }
  }

  function markPending(id: string, pending: boolean) {
    const index = pendingIds.value.indexOf(id)

    if (pending && index === -1) pendingIds.value.push(id)
    if (!pending && index !== -1) pendingIds.value.splice(index, 1)
  }

  async function sendMessage(content: string, parentMessage: string | null = null) {
    const user = currentUser.value

    if (!user || !content.trim()) return { success: false as const, error: "Nothing to send" }

    const optimistic: Message = {
      id: `pending_${Date.now()}`,
      channelId: activeChannelId.value,
      sender: user,
      content: content.trim(),
      parentMessage,
      replyCount: 0,
      reactions: [],
      editedAt: null,
      createdAt: new Date().toISOString(),
    }

    markPending(optimistic.id, true)

    if (parentMessage) threadMessages.value.push(optimistic)
    else messages.value.push(optimistic)

    try {
      const { data } = await api.post<{ message: Message }>(
        `/channels/${activeChannelId.value}/messages`,
        { content: content.trim(), parentMessage },
      )

      const list = parentMessage ? threadMessages.value : messages.value
      const index = list.findIndex((item) => item.id === optimistic.id)

      if (index !== -1) list.splice(index, 1, data.message)
      else upsertMessage(list, data.message)

      markPending(optimistic.id, false)

      if (parentMessage) bumpReplyCount(parentMessage, data.message.replyCount)

      return { success: true as const, message: data.message }
    } catch (err) {
      dropMessage(parentMessage ? threadMessages.value : messages.value, optimistic.id)
      markPending(optimistic.id, false)
      return { success: false as const, error: errorMessage(err) }
    }
  }

  function bumpReplyCount(parentId: string, count: number) {
    const parent = messages.value.find((item) => item.id === parentId)
    if (parent) parent.replyCount = count
  }

  async function editMessage(messageId: string, content: string) {
    try {
      const { data } = await api.patch<{ message: Message }>(`/messages/${messageId}`, {
        content,
      })

      upsertMessage(messages.value, data.message)
      upsertMessage(threadMessages.value, data.message)

      return { success: true as const }
    } catch (err) {
      return { success: false as const, error: errorMessage(err) }
    }
  }

  async function deleteMessage(messageId: string) {
    try {
      await api.delete(`/messages/${messageId}`)

      dropMessage(messages.value, messageId)
      dropMessage(threadMessages.value, messageId)

      await loadMessages(activeChannelId.value, activeParentId.value ?? "root")

      return { success: true as const }
    } catch (err) {
      return { success: false as const, error: errorMessage(err) }
    }
  }

  async function toggleReaction(messageId: string, emoji: string) {
    try {
      const { data } = await api.post<{ message: Message }>(
        `/messages/${messageId}/reactions`,
        { emoji },
      )

      upsertMessage(messages.value, data.message)
      upsertMessage(threadMessages.value, data.message)

      return { success: true as const }
    } catch (err) {
      return { success: false as const, error: errorMessage(err) }
    }
  }

  async function reportMessage(messageId: string, reason: string) {
    try {
      await api.post(`/messages/${messageId}/reports`, { reason })
      return { success: true as const }
    } catch (err) {
      return { success: false as const, error: errorMessage(err) }
    }
  }

  async function loadReports(channelId?: string) {
    try {
      const { data } = await api.get<{ reports: Report[] }>("/reports", {
        params: channelId ? { channelId } : undefined,
      })

      return data.reports
    } catch (err) {
      error.value = errorMessage(err, "Could not load reports")
      return []
    }
  }

  async function resolveReport(reportId: string) {
    try {
      await api.post(`/reports/${reportId}/resolve`)
      return { success: true as const }
    } catch (err) {
      return { success: false as const, error: errorMessage(err) }
    }
  }

  function notifyTyping() {
    const now = Date.now()
    if (now - typingSentAt < 1500) return

    typingSentAt = now
    socketClient.send({ type: "typing", channelId: activeChannelId.value })
  }

  function handleEvent(event: import("../interfaces").ServerEvent) {
    if (event.type === "presence") {
      onlineIds.value = event.online ?? []
      return
    }

    if (event.type === "channel:created" && event.channel) {
      replaceChannel(event.channel)
      return
    }

    if (event.type === "channel:updated" && event.channel) {
      replaceChannel(event.channel)
      return
    }

    if (event.type === "channel:deleted" && event.channelId) {
      channels.value = channels.value.filter((channel) => channel.id !== event.channelId)
      return
    }

    if (event.channelId !== activeChannelId.value) return
    if (!canAccess.value) return

    if (event.type === "message:new" && event.message) {
      const incoming = event.message

      if (incoming.parentMessage === activeParentId.value && activeParentId.value) {
        upsertMessage(threadMessages.value, incoming)
      } else if (incoming.parentMessage === null) {
        upsertMessage(messages.value, incoming)
      }

      return
    }

    if (event.type === "message:update" && event.message) {
      upsertMessage(messages.value, event.message)
      upsertMessage(threadMessages.value, event.message)
      return
    }

    if (event.type === "reaction:update" && event.message) {
      upsertMessage(messages.value, event.message)
      upsertMessage(threadMessages.value, event.message)
      return
    }

    if (event.type === "message:delete" && event.messageId) {
      dropMessage(messages.value, event.messageId)
      dropMessage(threadMessages.value, event.messageId)
      return
    }

    if (event.type === "typing" && event.userId && event.userId !== currentUser.value?.id) {
      const list = typingUsers.value[event.channelId!] ?? []

      if (!list.includes(event.username!)) {
        typingUsers.value = {
          ...typingUsers.value,
          [event.channelId!]: [...list, event.username!],
        }
      }

      window.setTimeout(() => {
        const current = typingUsers.value[event.channelId!] ?? []
        typingUsers.value = {
          ...typingUsers.value,
          [event.channelId!]: current.filter((name) => name !== event.username),
        }
      }, TYPING_TIMEOUT)
    }
  }

  function start() {
    unsubscribe?.()
    unsubscribe = socketClient.subscribe(handleEvent)
    socketClient.connect()
  }

  function stop() {
    unsubscribe?.()
    unsubscribe = null
  }

  async function initialize() {
    await Promise.all([loadChannels(), loadUsers()])

    const fallback = channels.value.find((channel) => channel.joined) ?? channels.value[0]

    if (fallback && fallback.id !== activeChannelId.value) {
      await selectChannel(fallback.id)
    } else if (channels.value.length) {
      await loadMessages()
    }
  }

  return {
    channels,
    users,
    messages,
    threadMessages,
    activeChannelId,
    activeParentId,
    threadParent,
    visibleMessages,
    activeChannel,
    onlineUsers,
    onlineIds,
    typingUsers,
    pendingIds,
    loading,
    error,
    isMember,
    canAccess,
    canManage,
    initialize,
    start,
    stop,
    loadChannels,
    loadUsers,
    loadMessages,
    loadReports,
    selectChannel,
    openThread,
    createChannel,
    updateChannel,
    deleteChannel,
    joinChannel,
    leaveChannel,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    reportMessage,
    resolveReport,
    notifyTyping,
  }
}