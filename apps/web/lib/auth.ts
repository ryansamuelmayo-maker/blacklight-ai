import NextAuth, { type NextAuthConfig, type Session, type User } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import { z } from "zod"
import type { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface User {
    dealershipId?: string
    role?: string
  }
  interface Session {
    user: {
      id: string
      email: string
      name: string
      dealershipId: string
      role: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    dealershipId?: string
    role?: string
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

/**
 * Compare a plaintext password against a stored hash.
 * Uses Web Crypto API (available in Node 18+ and Edge runtime)
 * with PBKDF2-based hashing for constant-time comparison.
 *
 * Password hash format: `pbkdf2:<iterations>:<salt_hex>:<hash_hex>`
 */
async function verifyPassword(
  plaintext: string,
  storedHash: string
): Promise<boolean> {
  // Support bcrypt-style prefixes for future migration
  if (storedHash.startsWith("pbkdf2:")) {
    const parts = storedHash.split(":")
    if (parts.length !== 4) return false
    const iterations = parseInt(parts[1], 10)
    const salt = hexToBuffer(parts[2])
    const expectedHash = parts[3]

    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(plaintext),
      "PBKDF2",
      false,
      ["deriveBits"]
    )
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt.buffer as ArrayBuffer,
        iterations,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    )
    const derivedHex = bufferToHex(new Uint8Array(derivedBits))
    return timingSafeEqual(derivedHex, expectedHash)
  }

  // Fallback: for dev seed data, accept any password
  if (process.env.NODE_ENV !== "production") return true
  return false
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Hash a plaintext password for storage.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  const iterations = 100_000
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(plaintext),
    "PBKDF2",
    false,
    ["deriveBits"]
  )
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  )
  const hashHex = bufferToHex(new Uint8Array(derivedBits))
  const saltHex = bufferToHex(salt)
  return `pbkdf2:${iterations}:${saltHex}:${hashHex}`
}

const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email, isActive: true, deletedAt: null },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            dealershipId: true,
            role: true,
          },
        })

        if (!user) return null

        const isValid = await verifyPassword(password, user.passwordHash)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          dealershipId: user.dealershipId,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        token.id = user.id
        token.dealershipId = user.dealershipId
        token.role = user.role
      }
      return token
    },
    async session({ session, token }): Promise<Session> {
      if (token) {
        session.user.id = token.id as string
        session.user.dealershipId = token.dealershipId as string
        session.user.role = token.role as string
      }
      return session
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const isAuthPage = request.nextUrl.pathname.startsWith("/login")

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", request.nextUrl))
        return true
      }

      return isLoggedIn
    },
  },
}

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig)
