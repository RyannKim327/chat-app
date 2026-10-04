import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

import { env } from "../env.ts"
import type { PublicUser, UserRecord } from "../models/types.ts"

const SALT_ROUNDS = 10

export interface TokenPayload {
  sub: string
  username: string
}

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash)
}

export function signToken(user: UserRecord) {
  const payload: TokenPayload = {
    sub: user.id,
    username: user.username,
  }

  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions)
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as TokenPayload
  } catch {
    return null
  }
}

export function toPublicUser(user: UserRecord): PublicUser {
  const { password: _password, ...rest } = user
  return rest
}