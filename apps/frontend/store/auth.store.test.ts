import { describe, it, expect, beforeEach, vi } from "vitest"
import axios from "axios"
import { useAuthStore } from "./auth.store"

vi.mock("axios", () => ({ default: { get: vi.fn() } }))
vi.mock("@/lib/api", () => ({ api: { post: vi.fn().mockResolvedValue({}) } }))

const mockedGet = vi.mocked(axios.get)
const user = { id: "1", username: "test", email: "test@test.com", xp: 0, streak: 0 }

describe("useAuthStore", () => {
  beforeEach(async () => {
    mockedGet.mockReset()
    await useAuthStore.getState().logout()
    useAuthStore.setState({ hydrated: false })
  })

  it("starts unauthenticated and unhydrated", () => {
    const s = useAuthStore.getState()
    expect(s.user).toBeNull()
    expect(s.token).toBeNull()
    expect(s.hydrated).toBe(false)
  })

  it("hydrate restores the session from /user/me using the cookie", async () => {
    mockedGet.mockResolvedValue({ data: { data: user } })
    await useAuthStore.getState().hydrate()

    const s = useAuthStore.getState()
    expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining("/user/me"), { withCredentials: true })
    expect(s.user).toEqual(user)
    expect(s.token).toBeTruthy()
    expect(s.hydrated).toBe(true)
  })

  it("hydrate marks the store hydrated but logged out on 401", async () => {
    mockedGet.mockRejectedValue({ response: { status: 401 } })
    await useAuthStore.getState().hydrate()

    const s = useAuthStore.getState()
    expect(s.user).toBeNull()
    expect(s.token).toBeNull()
    expect(s.hydrated).toBe(true)
  })

  it("setAuth sets user, session marker and hydrated (no token argument needed)", () => {
    useAuthStore.getState().setAuth(user)

    const s = useAuthStore.getState()
    expect(s.user).toEqual(user)
    expect(s.token).toBeTruthy()
    expect(s.hydrated).toBe(true)
  })

  it("a stale hydrate() 401 does not overwrite a login that completed meanwhile", async () => {
    let rejectMe!: (e: unknown) => void
    mockedGet.mockReturnValue(new Promise((_, rej) => { rejectMe = rej }) as never)

    const pending = useAuthStore.getState().hydrate() // starts before login (e.g. cold backend)
    useAuthStore.getState().setAuth(user)             // user logs in while it is in flight
    rejectMe({ response: { status: 401 } })           // the old probe now fails
    await pending

    const s = useAuthStore.getState()
    expect(s.user).toEqual(user)
    expect(s.token).toBeTruthy()
  })

  it("logout clears user and session marker", async () => {
    useAuthStore.getState().setAuth(user)
    await useAuthStore.getState().logout()

    const s = useAuthStore.getState()
    expect(s.user).toBeNull()
    expect(s.token).toBeNull()
  })
})
