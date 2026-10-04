# us-app — Agent Context

> Project specification and AI assistant guidelines for **us-app**, a conversational messaging platform with a forum-style discussion format.

---

## 1. Project Overview

**us-app** is a real-time communication platform that blends the immediacy of a messenger with the threaded, discussion-based structure of a forum. Users can send messages, reply to specific messages to branch into discussions, and participate in topic-based conversations.

The core twist: instead of a flat chat stream, every message can become the root of a sub-conversation. This encourages deeper, organized discussions without losing the casual feel of a chat app.

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue.js 3 (Composition API recommended) |
| Backend | Express.js (Node.js) |
| Real-time | Socket.io (WebSockets) |
| Database | MongoDB (Mongoose) or PostgreSQL (Sequelize/Prisma) — decision needed |
| Auth | JWT (JSON Web Tokens) + bcrypt |
| Styling | Tailwind CSS or SCSS — decision needed |

---

## 3. Core Concept

### Messenger + Forum Hybrid

- **Messenger feel**: Real-time messaging, online presence indicators, simple and fast UI.
- **Forum structure**: Messages can have replies. Replies are threaded visually and logically.
- **Conversational threads**: Any message can be replied to directly, spawning a nested discussion thread.
- **Channels / Rooms**: Conversations happen inside channels (public or private).

### Key UX Principles

1. **Reply to Message**: Users can click "Reply" on any message. This creates a threaded sub-view or inline thread.
2. **Thread View**: When viewing a thread, the parent message is pinned at the top, and replies appear below in chronological order.
3. **Main Feed**: The main channel feed shows root-level messages. Threads are collapsed into a "X replies" indicator.
4. **Notifications**: Users get notified when someone replies to their message or mentions them with `@username`.

---

## 4. Features

### MVP Features

- [ ] User authentication (register, login, logout, JWT)
- [ ] Create and join channels (public)
- [ ] Send text messages in real-time
- [ ] Reply to a specific message (create a thread)
- [ ] View thread replies
- [ ] Basic user profile (username, avatar)
- [ ] Online/offline user status
- [ ] Message timestamps

### Post-MVP Features

- [ ] Private channels (invite-only)
- [ ] Message reactions (emoji)
- [ ] File attachments / image uploads
- [ ] Message editing and deletion
- [ ] Search messages within a channel
- [ ] Push notifications
- [ ] Typing indicators
- [ ] Direct messages (DMs)
- [ ] Message pinning
- [ ] Moderation tools (kick, ban, mute)
- [ ] Dark / light theme toggle

---

## 5. Data Models

### User

```json
{
  "_id": "ObjectId",
  "username": "string (unique)",
  "email": "string (unique)",
  "password": "string (hashed)",
  "avatar": "string (URL)",
  "status": "online | away | offline",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Channel

```json
{
  "_id": "ObjectId",
  "name": "string (unique, slugified)",
  "description": "string",
  "isPrivate": "boolean",
  "members": ["ObjectId (User)"],
  "createdBy": "ObjectId (User)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Message

```json
{
  "_id": "ObjectId",
  "channel": "ObjectId (Channel)",
  "sender": "ObjectId (User)",
  "content": "string",
  "parentMessage": "ObjectId (Message) | null",
  "replyCount": "number (default: 0)",
  "editedAt": "Date | null",
  "createdAt": "Date"
}
```

> **Note**: `parentMessage` is null for root-level messages. When populated, the message is a reply in a thread.

---

## 6. API Structure (Express.js)

Base path: `/api/v1`

### Auth Routes (`/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive JWT |
| POST | `/auth/logout` | Logout (client clears token) |
| GET | `/auth/me` | Get current user profile |

### Channel Routes (`/channels`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/channels` | List all public channels |
| POST | `/channels` | Create a new channel |
| GET | `/channels/:id` | Get channel details |
| POST | `/channels/:id/join` | Join a channel |
| POST | `/channels/:id/leave` | Leave a channel |

### Message Routes (`/messages`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/messages?channelId=` | Get root messages for a channel |
| POST | `/messages` | Send a new message |
| GET | `/messages/:id/replies` | Get replies to a message (thread) |
| POST | `/messages/:id/reply` | Reply to a specific message |
| PATCH | `/messages/:id` | Edit a message |
| DELETE | `/messages/:id` | Delete a message |

### User Routes (`/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/:id` | Get public user profile |
| PATCH | `/users/:id` | Update profile (avatar, etc.) |
| GET | `/users/search?q=` | Search users |

---

## 7. Socket.io Events

### Client to Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_channel` | `{ channelId }` | Subscribe to a channel room |
| `leave_channel` | `{ channelId }` | Unsubscribe from a channel room |
| `send_message` | `{ channelId, content, parentMessageId? }` | Send a message or reply |
| `typing_start` | `{ channelId }` | User started typing |
| `typing_stop` | `{ channelId }` | User stopped typing |

### Server to Client

| Event | Payload | Description |
|-------|---------|-------------|
| `message_received` | `Message` | New message in subscribed channel |
| `thread_reply` | `Message` | New reply to a message |
| `user_typing` | `{ channelId, username }` | Someone is typing |
| `user_online` | `{ userId }` | User came online |
| `user_offline` | `{ userId }` | User went offline |

---

## 8. Frontend Structure (Vue.js)

### Recommended Directory Structure

```
src/
├── assets/              # Images, fonts, global styles
├── components/          # Reusable components
│   ├── ChatMessage.vue
│   ├── ChatThread.vue
│   ├── ChannelList.vue
│   ├── ChannelItem.vue
│   ├── UserAvatar.vue
│   ├── ReplyIndicator.vue
│   └── ThreadPanel.vue
├── views/               # Page-level views
│   ├── LoginView.vue
│   ├── RegisterView.vue
│   ├── ChannelView.vue
│   ├── ThreadView.vue
│   └── ProfileView.vue
├── composables/         # Vue composables
│   ├── useSocket.js
│   ├── useAuth.js
│   └── useChannels.js
├── stores/              # Pinia stores
│   ├── authStore.js
│   ├── channelStore.js
│   └── messageStore.js
├── router/              # Vue Router
│   └── index.js
├── services/            # API calls
│   ├── api.js           # Axios instance
│   ├── authService.js
│   ├── channelService.js
│   └── messageService.js
└── App.vue
```

### Key UI Components

1. **ChannelView**: Main layout with channel list sidebar and message feed.
2. **ChatMessage**: Individual message bubble with reply button, avatar, timestamp, and reply count.
3. **ThreadPanel**: Slide-out or inline panel that opens when a message's thread is viewed.
4. **ReplyIndicator**: Small UI element showing that the current draft is a reply to a specific message.

---

## 9. Development Guidelines

### Code Style

- Use **Vue 3 Composition API** with `<script setup>` syntax.
- Use **async/await** for all asynchronous operations.
- Follow RESTful conventions for API design.
- Use consistent naming: camelCase for variables/functions, PascalCase for components.

### State Management

- Use **Pinia** for global state (auth, channels, messages).
- Keep socket event listeners inside composables or stores to centralize logic.

### Security

- Hash passwords with bcrypt before storing.
- Validate all inputs on both client and server.
- Protect routes with JWT middleware.
- Use CORS appropriately for development vs production.
- Sanitize message content to prevent XSS.

### Real-time Considerations

- Reconnect socket on disconnect.
- Optimistically update UI on message send, roll back on error.
- Debounce typing indicators (e.g., 300ms).

---

## 10. Database Decisions to Make

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Database | MongoDB vs PostgreSQL | MongoDB if nested/threaded data is highly dynamic; PostgreSQL if strong relational integrity is preferred |
| ORM/ODM | Mongoose vs Prisma | Mongoose for MongoDB; Prisma for PostgreSQL |

---

## 11. Environment Variables

```env
# Server
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173

# Client
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

---

## 12. AI Assistant Instructions

When working on **us-app**:

1. Always respect the messenger + forum hybrid concept. Every feature should reinforce threaded, conversational discussion.
2. Prefer real-time updates via Socket.io over polling where possible.
3. Keep the UI lightweight and chat-like; avoid heavy forum paradigms like pagination-heavy UIs unless requested.
4. Maintain clear separation between root messages (channel feed) and thread replies.
5. When suggesting data models, always include `parentMessage` for thread support.
6. Use the tech stack specified: Vue.js + Express.js + Socket.io.

---

*Document version: 1.0*
*Last updated: 2026-10-04*
