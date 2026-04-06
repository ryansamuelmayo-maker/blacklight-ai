"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export default function InvitePage() {
  const [name, setName] = useState("")
  const [email] = useState("invited@dealership.com")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const passwordsMatch = password === confirmPassword
  const canSubmit =
    name.trim().length > 0 &&
    password.length >= 8 &&
    passwordsMatch

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setIsLoading(true)
    // TODO: integrate with invite acceptance API
    setTimeout(() => setIsLoading(false), 1500)
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl bg-card p-8 shadow-2xl shadow-black/20">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand shadow-lg shadow-brand/30">
            <svg
              width="28"
              height="28"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M10 2L3 6v8l7 4 7-4V6l-7-4z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M10 7a3 3 0 100 6 3 3 0 000-6z"
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Join Blacklight AI
          </h1>
          <p className="mt-1 text-center text-sm text-muted">
            You&apos;ve been invited to join your team.
            <br />
            Set up your account to get started.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Full name
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div>
            <label
              htmlFor="invite-email"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border border-border bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
            />
          </div>

          <div>
            <label
              htmlFor="invite-password"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="invite-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Confirm password
            </label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className={cn(
                "w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2",
                confirmPassword.length > 0 && !passwordsMatch
                  ? "border-danger focus:border-danger focus:ring-danger/20"
                  : "border-border focus:border-brand focus:ring-brand/20"
              )}
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-xs text-danger">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !canSubmit}
            className={cn(
              "flex w-full items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors",
              "hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-60"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-white/50">
        Blacklight AI &mdash; Revenue Operating System
      </p>
    </div>
  )
}
