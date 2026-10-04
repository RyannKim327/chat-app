import fs from "node:fs/promises"
import path from "node:path"

import type {
  ChannelRecord,
  MessageRecord,
  ReportRecord,
  UserRecord,
} from "../models/types.ts"
import { createSeed } from "./seed.ts"

export interface Collections {
  users: UserRecord[]
  channels: ChannelRecord[]
  messages: MessageRecord[]
  reports: ReportRecord[]
}

export type CollectionName = keyof Collections

type Doc<K extends CollectionName> = Collections[K][number]

interface Identified {
  id: string
}

const COLLECTIONS: CollectionName[] = [
  "users",
  "channels",
  "messages",
  "reports",
]

function emptyData(): Collections {
  return { users: [], channels: [], messages: [], reports: [] }
}

export class JsonStore {
  private data: Collections = emptyData()

  private queue: Promise<unknown> = Promise.resolve()

  constructor(private readonly file: string) {}

  get filePath() {
    return this.file
  }

  async load() {
    let raw: string | null = null

    try {
      raw = await fs.readFile(this.file, "utf8")
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    }

    if (raw === null) {
      this.data = createSeed()
      await this.persist()
      return this.data
    }

    let parsed: unknown

    try {
      parsed = JSON.parse(raw)
    } catch {
      const broken = `${this.file}.broken-${Date.now()}`
      await fs.rename(this.file, broken)
      console.error(
        `[db] could not parse ${this.file}, moved to ${broken} and reseeded`,
      )
      this.data = createSeed()
      await this.persist()
      return this.data
    }

    const source = (parsed ?? {}) as Partial<Collections>

    this.data = {
      users: Array.isArray(source.users) ? source.users : [],
      channels: Array.isArray(source.channels) ? source.channels : [],
      messages: Array.isArray(source.messages) ? source.messages : [],
      reports: Array.isArray(source.reports) ? source.reports : [],
    }

    for (const name of COLLECTIONS) this.dedupe(name)

    return this.data
  }

  all<K extends CollectionName>(name: K): Doc<K>[] {
    return this.data[name] as Doc<K>[]
  }

  find<K extends CollectionName>(name: K, id: string): Doc<K> | undefined {
    return (this.data[name] as Identified[]).find((item) => item.id === id) as
      | Doc<K>
      | undefined
  }

  findBy<K extends CollectionName>(
    name: K,
    predicate: (item: Doc<K>) => boolean,
  ): Doc<K> | undefined {
    return (this.data[name] as Doc<K>[]).find(predicate)
  }

  filter<K extends CollectionName>(
    name: K,
    predicate: (item: Doc<K>) => boolean,
  ): Doc<K>[] {
    return (this.data[name] as Doc<K>[]).filter(predicate)
  }

  async insert<K extends CollectionName>(name: K, document: Doc<K> & Identified) {
    ;(this.data[name] as Doc<K>[]).push(document)
    await this.persist()
    return document
  }

  async update<K extends CollectionName>(
    name: K,
    id: string,
    patch: Partial<Doc<K>> | ((item: Doc<K>) => Partial<Doc<K>>),
  ): Promise<Doc<K> | undefined> {
    const current = this.find(name, id)

    if (!current) return undefined

    const changes = typeof patch === "function" ? patch(current) : patch

    Object.assign(current as object, changes)

    if ("updatedAt" in current) {
      ;(current as unknown as { updatedAt: string }).updatedAt =
        new Date().toISOString()
    }

    await this.persist()
    return current
  }

  async remove<K extends CollectionName>(name: K, id: string) {
    const bucket = this.data[name] as Identified[]
    const index = bucket.findIndex((item) => item.id === id)

    if (index === -1) return false

    bucket.splice(index, 1)
    await this.persist()
    return true
  }

  private dedupe(name: CollectionName) {
    const seen = new Set<string>()

    const cleaned = (this.data[name] as unknown[]).filter((item) => {
      const id = (item as Identified | null)?.id

      if (typeof id !== "string" || seen.has(id)) return false

      seen.add(id)
      return true
    })

    ;(this.data as Record<CollectionName, unknown[]>)[name] = cleaned
  }

  private persist() {
    this.queue = this.queue
      .catch(() => undefined)
      .then(async () => {
        const dir = path.dirname(this.file)

        await fs.mkdir(dir, { recursive: true })

        const temp = `${this.file}.${process.pid}.tmp`

        await fs.writeFile(
          temp,
          `${JSON.stringify(this.data, null, 2)}\n`,
          "utf8",
        )
        await fs.rename(temp, this.file)
      })
      .catch((error: unknown) => {
        console.error("[db] write failed", error)
      })

    return this.queue
  }
}

let instance: JsonStore | undefined

export function getStore(): JsonStore {
  if (!instance) throw new Error("store has not been initialised")
  return instance
}

export async function initStore(file: string) {
  instance = new JsonStore(file)
  await instance.load()
  return instance
}