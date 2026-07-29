import { describe, it, expect, beforeAll } from "vitest"
import { comparePassword } from "@/lib/auth/password"
import { signToken, verifyToken } from "@/lib/auth/jwt"

describe("password utils", () => {
  it("compares against the presaved .env password", async () => {
    // Default password is "123" (fallback in backend-api.ts)
    const match = await comparePassword("123")
    expect(match).toBe(true)

    const noMatch = await comparePassword("wrong-password")
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
