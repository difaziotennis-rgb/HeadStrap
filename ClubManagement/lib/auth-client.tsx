"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type UserRole = "admin" | "member"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  memberNumber?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string, role: UserRole) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/check", {
        cache: "no-store",
      })
      
      if (!response.ok) {
        throw new Error("Auth check failed")
      }
      
      const data = await response.json()

      if (data.authenticated && data.user) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string, role: UserRole) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, role }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Login failed")
    }

    if (data.user) {
      setUser(data.user)
    }
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
  }

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null
    let resolved = false
    
    const resolveLoading = () => {
      if (!resolved && isMounted) {
        resolved = true
        setLoading(false)
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    }
    
    const performCheck = async () => {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 1500)
        
        const response = await fetch("/api/auth/check", {
          cache: "no-store",
          signal: controller.signal,
        })
        
        clearTimeout(timeout)
        
        if (!response.ok) {
          throw new Error("Auth check failed")
        }
        
        const data = await response.json()

        if (isMounted && !resolved) {
          if (data.authenticated && data.user) {
            setUser(data.user)
          } else {
            setUser(null)
          }
          resolveLoading()
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Auth check failed:", error)
        }
        if (isMounted && !resolved) {
          setUser(null)
          resolveLoading()
        }
      }
    }
    
    // Set a timeout to prevent infinite loading (1.5 seconds)
    timeoutId = setTimeout(() => {
      if (isMounted && !resolved) {
        console.warn("Auth check timeout, stopping loading state")
        setUser(null)
        resolveLoading()
      }
    }, 1500)
    
    performCheck()
    
    return () => {
      isMounted = false
      resolved = true
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

