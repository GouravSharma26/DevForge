import { describe, it, expect, vi } from "vitest"
import { registerArenaHandlers } from "../src/sockets/arena.socket"

describe("Arena Socket Handlers", () => {
  it("should reject unauthenticated code_change", () => {
    const emitMock = vi.fn()
    const toEmitMock = vi.fn()
    const toMock = vi.fn(() => ({ emit: toEmitMock }))
    
    const mockSocket = {
      data: { userId: "user-1" },
      on: vi.fn(),
      emit: emitMock,
      to: toMock,
      join: vi.fn(),
      leave: vi.fn(),
      disconnect: vi.fn(),
    } as any

    registerArenaHandlers({} as any, mockSocket)

    // Extract the code_change handler
    const codeChangeCall = mockSocket.on.mock.calls.find((c: any) => c[0] === "arena:code_change")
    const handler = codeChangeCall[1]

    // Execute the handler with a fake matchId
    handler({ matchId: "fake-match", code: "console.log()" })

    expect(emitMock).toHaveBeenCalledWith("arena:error", { message: "Unauthorized code change" })
    expect(toMock).not.toHaveBeenCalled()
  })
})
