import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import SignupPage from "@/app/signup/page"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    signup: vi.fn(),
    user: null,
    loading: false,
  }),
}))

describe("SignupPage", () => {
  it("renders create account form", () => {
    render(<SignupPage />)
    expect(screen.getAllByText("Create Account").length).toBeGreaterThanOrEqual(2)
    expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("admin@example.com")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("At least 6 characters")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument()
  })

  it("has link to signin", () => {
    render(<SignupPage />)
    expect(screen.getByText("Sign In")).toBeInTheDocument()
  })
})
