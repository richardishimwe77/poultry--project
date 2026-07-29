import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import LoginPage from "@/app/login/page"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    login: vi.fn(),
    user: null,
    loading: false,
  }),
}))

describe("LoginPage", () => {
  it("renders sign in form", () => {
    render(<LoginPage />)
    expect(screen.getAllByText("Sign In").length).toBeGreaterThanOrEqual(2)
    expect(screen.getByPlaceholderText("admin@example.com")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument()
  })

  it("has link to signup", () => {
    render(<LoginPage />)
    expect(screen.getByText("Sign Up")).toBeInTheDocument()
  })
})
