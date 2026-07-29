import { describe, it, expect } from "vitest"
import { hashPassword, comparePassword } from "@/lib/auth/password"
import { signToken, verifyToken } from "@/lib/auth/jwt"

describe("password utils", () => {
  it("hashes and compares passwords correctly", async () => {
    const hash = await hashPassword("hello123")
    expect(hash).not.toBe("hello123")
    expect(hash.startsWith("$2")).toBe(true)

    const match = await comparePassword("hello123", hash)
    expect(match).toBe(true)

    const noMatch = await comparePassword("wrong", hash)
    expect(noMatch).toBe(false)
  })
})

describe("jwt utils", () => {
  it("signs and verifies tokens", () => {
    const payload = { userId: "abc-123", email: "test@test.com", role: "admin" }
    const token = signToken(payload)
    expect(typeof token).toBe("string")
    expect(token.split(".").length).toBe(3)

    const decoded = verifyToken(token)
    expect(decoded.userId).toBe("abc-123")
    expect(decoded.email).toBe("test@test.com")
    expect(decoded.role).toBe("admin")
  })

  it("throws on invalid token", () => {
    expect(() => verifyToken("invalid-token")).toThrow()
  })
})
