'use client'

import { useState } from 'react'
import { Lock, LogIn, X } from 'lucide-react'

export function ClubAdminLoginModal({ clubId, clubSlug }: { clubId: string; clubSlug: string }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password) {
      setError('Please enter the club admin password')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/club-admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ club_id: clubId, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Success - redirect to admin page after a brief delay to ensure cookie is set
      setOpen(false)
      setPassword('')
      // Small delay to ensure cookie is set before redirect
      setTimeout(() => {
        window.location.href = `/club/${clubSlug}/ladder-admin`
      }, 100)
    } catch (error: any) {
      setError(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setError(null)
    setPassword('')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#7a756d] hover:text-[#1a1a1a] border border-[#e8e5df] rounded-lg hover:border-[#c4bfb8] transition-all"
      >
        <Lock className="w-3 h-3" />
        Club Admin
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose} />

          {/* Modal */}
          <div className="relative bg-[#faf9f7] rounded-2xl shadow-lg border border-[#e8e5df] w-full max-w-[380px] mx-4">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-[#e8e5df]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#b0a99f] mb-1">Admin Access</p>
                  <h2 className="text-lg font-light text-[#1a1a1a]">Club Admin Login</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 hover:bg-[#f0ede8] rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-[#7a756d]" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <p className="text-[12px] text-[#7a756d]">
                Enter the club admin password to manage this club.
              </p>

              {error && (
                <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-lg text-[12px] text-[#991b1b]">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="admin-password" className="block text-[10px] tracking-[0.1em] uppercase text-[#7a756d] font-medium">
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  placeholder="Enter club admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2 bg-white border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 text-[12px] font-medium text-[#7a756d] border border-[#e8e5df] rounded-lg hover:bg-[#f0ede8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-[#1a1a1a] text-white text-[12px] font-medium rounded-lg hover:bg-[#333] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? 'Logging in...' : (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      Login
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
