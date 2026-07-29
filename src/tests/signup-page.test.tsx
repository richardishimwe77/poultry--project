import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import SignupPage from "@/app/signup/page"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe("SignupPage", () => {
  it("shows sign-up disabled message", () => {
    render(<SignupPage />)
    expect(screen.getByText("Sign-up Disabled")).toBeInTheDocument()
    expect(
      screen.getByText(
        "New account registration is not available. Use the preconfigured admin credentials to sign in.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("Redirecting to sign in...")).toBeInTheDocument()
  })
})
