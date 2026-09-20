import { renderHook, act } from "@testing-library/react"
import { useAuthStore } from "./auth.store"

describe("useAuthStore", () => {
  beforeEach(() => {
    localStorage.clear()
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.logout()
    })
  })

  it("should start unauthenticated and unhydrated", () => {
    const { result } = renderHook(() => useAuthStore())
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.hydrated).toBe(false)
  })

  it("should hydrate from localStorage", () => {
    localStorage.setItem("access_token", "test-token")
    
    const { result } = renderHook(() => useAuthStore())
    
    act(() => {
      result.current.hydrate()
    })

    expect(result.current.token).toBe("test-token")
    expect(result.current.hydrated).toBe(true)
  })

  it("should set authentication and save to localStorage", () => {
    const { result } = renderHook(() => useAuthStore())
    const user = { id: "1", username: "test", email: "test@test.com", xp: 0, streak: 0 }
    
    act(() => {
      result.current.setAuth(user, "new-token")
    })

    expect(result.current.user).toEqual(user)
    expect(result.current.token).toBe("new-token")
    expect(localStorage.getItem("access_token")).toBe("new-token")
  })

  it("should clear auth on logout", () => {
    localStorage.setItem("access_token", "test-token")
    const { result } = renderHook(() => useAuthStore())
    
    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(localStorage.getItem("access_token")).toBeNull()
  })
})
