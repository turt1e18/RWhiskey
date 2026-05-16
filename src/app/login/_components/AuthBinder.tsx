"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "./LoginForm"
import SignupForm from "./SignupForm"
import PasswordResetForm from "./PasswordResetForm"

export type Screen = "login" | "signup" | "reset"

export default function AuthBinder() {
  const [screen, setScreen] = useState<Screen>("login")
  const [animating, setAnimating] = useState(false)
  const [key, setKey] = useState(0)
  const router = useRouter()

  const transition = useCallback((next: Screen) => {
    setAnimating(true)
    setTimeout(() => {
      setScreen(next)
      setKey((k) => k + 1)
      setAnimating(false)
    }, 300)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 wood-table-spotlight relative">
      {/* Back to Home Button */}
      <button
        onClick={() => router.push("/main")}
        className="absolute top-8 left-8 flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-200 group"
      >
        <span className="text-2xl group-hover:-translate-x-1 transition-transform duration-200">←</span>
        <span className="font-serif text-sm tracking-widest uppercase">Home</span>
      </button>

      {/* Order slip card */}
      <div
        className={`relative w-full max-w-md bg-white shadow-2xl
          transition-opacity duration-300 ${animating ? "opacity-0" : "opacity-100"}`}
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(155, 139, 126, 0.2)",
        }}
      >
        {/* Decorative header line */}
        <div
          className="w-full h-1"
          style={{ background: "repeating-linear-gradient(to right, #3E2A1E 0px, #3E2A1E 12px, transparent 12px, transparent 16px)" }}
          aria-hidden="true"
        />

        {/* Content area */}
        <div key={key} className="px-8 py-10 paper-texture">
          {screen === "login" ? (
            <LoginForm 
              onSignup={() => transition("signup")} 
              onReset={() => transition("reset")}
            />
          ) : screen === "signup" ? (
            <SignupForm onBack={() => transition("login")} />
          ) : (
            <PasswordResetForm onBack={() => transition("login")} />
          )}
        </div>

        {/* Decorative footer line */}
        <div
          className="w-full h-1"
          style={{ background: "repeating-linear-gradient(to right, #3E2A1E 0px, #3E2A1E 12px, transparent 12px, transparent 16px)" }}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
