import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@devforge/database"
import { unlockNode, completeNode } from "../src/services/learn.service"
import { submitSolution } from "../src/services/problems.service"

vi.mock("@devforge/database", () => ({
  prisma: {
    skillProgress: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      upsert: vi.fn(),
    },
    skillNode: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    submission: {
      create: vi.fn(),
    },
    $executeRaw: vi.fn(),
  }
}))

vi.mock("../src/services/problems.service", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    runTestCase: vi.fn().mockResolvedValue({ status: "accepted" })
  }
})

describe("C3: Skill-tree progression integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("unlockNode makes update a no-op if status is already COMPLETED", async () => {
    vi.mocked(prisma.skillProgress.findUnique).mockResolvedValueOnce({
      id: "prog1",
      userId: "u1",
      nodeId: "n1",
      status: "COMPLETED",
      completedAt: new Date()
    } as any)

    const result = await unlockNode("u1", "n1")
    expect(prisma.skillProgress.update).not.toHaveBeenCalled()
    expect(result.status).toBe("COMPLETED")
  })

  it("completeNode unlocks a dependent only when all of its dependsOn nodes are COMPLETED", async () => {
    vi.mocked(prisma.skillProgress.upsert).mockResolvedValueOnce({} as any)
    
    // Setup a dependent node that depends on 'n1' and 'n2'
    vi.mocked(prisma.skillNode.findMany).mockResolvedValueOnce([
      { id: "dep1", dependsOn: ["n1", "n2"], problemSlug: "p-dep" } as any
    ])

    // Scenario 1: Only 'n1' is completed
    vi.mocked(prisma.skillProgress.findMany).mockResolvedValueOnce([
      { userId: "u1", nodeId: "n1", status: "COMPLETED" } as any
    ])

    await completeNode("u1", "n2") // We are completing 'n2', so completed are n1 (from db) and n2 (current)
    expect(prisma.skillProgress.createMany).toHaveBeenCalledWith({
      data: [{ userId: "u1", nodeId: "dep1", status: "UNLOCKED" }],
      skipDuplicates: true
    })
  })

  it("completeNode doesn't unlock dependent if prerequisite is missing", async () => {
    vi.mocked(prisma.skillProgress.upsert).mockResolvedValueOnce({} as any)
    vi.mocked(prisma.skillNode.findMany).mockResolvedValueOnce([
      { id: "dep1", dependsOn: ["n1", "n2", "n3"], problemSlug: "p-dep" } as any
    ])
    // Only 'n1' is completed, 'n2' is being completed, 'n3' is missing
    vi.mocked(prisma.skillProgress.findMany).mockResolvedValueOnce([
      { userId: "u1", nodeId: "n1", status: "COMPLETED" } as any
    ])

    await completeNode("u1", "n2")
    expect(prisma.skillProgress.createMany).not.toHaveBeenCalled()
  })
})
