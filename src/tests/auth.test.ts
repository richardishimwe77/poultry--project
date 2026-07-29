import { beforeEach, describe, expect, it } from "vitest"
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/auth-storage"

describe("auth storage", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("stores and reads auth token", () => {
    setStoredToken("token-123")
    expect(getStoredToken()).toBe("token-123")
  })

  it("clears auth token", () => {
    setStoredToken("token-123")
    clearStoredToken()
    expect(getStoredToken()).toBeNull()
  })
})
