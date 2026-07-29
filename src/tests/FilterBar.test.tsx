import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { FilterBar } from "@/components/FilterBar"

describe("FilterBar", () => {
  const mockOnFilterChange = vi.fn()
  const mockOnCustomRange = vi.fn()

  it("renders all filter buttons", () => {
    render(
      <FilterBar
        active="daily"
        onFilterChange={mockOnFilterChange}
        onCustomRange={mockOnCustomRange}
      />,
    )
    expect(screen.getByText("Today")).toBeInTheDocument()
    expect(screen.getByText("Daily")).toBeInTheDocument()
    expect(screen.getByText("Weekly")).toBeInTheDocument()
    expect(screen.getByText("Monthly")).toBeInTheDocument()
    expect(screen.getByText("Yearly")).toBeInTheDocument()
    expect(screen.getByText("Custom")).toBeInTheDocument()
  })

  it("highlights the active filter", () => {
    render(
      <FilterBar
        active="weekly"
        onFilterChange={mockOnFilterChange}
        onCustomRange={mockOnCustomRange}
      />,
    )
    const weeklyBtn = screen.getByText("Weekly")
    expect(weeklyBtn.className).toContain("bg-blue-600")
  })

  it("calls onFilterChange when a filter is clicked", () => {
    render(
      <FilterBar
        active="daily"
        onFilterChange={mockOnFilterChange}
        onCustomRange={mockOnCustomRange}
      />,
    )
    fireEvent.click(screen.getByText("Monthly"))
    expect(mockOnFilterChange).toHaveBeenCalledWith("monthly")
  })

  it("shows date inputs when custom is active", () => {
    const { container } = render(
      <FilterBar
        active="custom"
        onFilterChange={mockOnFilterChange}
        onCustomRange={mockOnCustomRange}
      />,
    )
    const dateInputs = container.querySelectorAll('input[type="date"]')
    expect(dateInputs.length).toBe(2)
  })
})
