import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { StatisticsPanel } from "@/components/StatisticsPanel"

describe("StatisticsPanel", () => {
  const mockStats = { current: 32.5, average: 30.2, highest: 35.1, lowest: 25.0 }

  it("renders all four stat cards", () => {
    render(<StatisticsPanel title="Temperature" stats={mockStats} unit="°C" />)
    expect(screen.getByText("Current Temperature")).toBeInTheDocument()
    expect(screen.getByText("Average Temperature")).toBeInTheDocument()
    expect(screen.getByText("Highest Temperature")).toBeInTheDocument()
    expect(screen.getByText("Lowest Temperature")).toBeInTheDocument()
  })

  it("displays correct values with units", () => {
    render(<StatisticsPanel title="Temperature" stats={mockStats} unit="°C" />)
    expect(screen.getByText("32.5")).toBeInTheDocument()
    expect(screen.getByText("30.2")).toBeInTheDocument()
    expect(screen.getByText("35.1")).toBeInTheDocument()
    expect(screen.getByText("25")).toBeInTheDocument()
  })
})
