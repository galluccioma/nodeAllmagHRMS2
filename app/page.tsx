"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Users, Bell, Shield } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token")
    if (token) {
      router.push("/dashboard")
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        router.push("/dashboard")
      } else {
        setError(data.error || "Login failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
  <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
    {/* Lato sinistro - Funzionalità */}
    <div className="space-y-8">
      <div className="text-center lg:text-left">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Allmag Software</h1>
        <p className="text-xl text-gray-600 mb-8">
          Piattaforma sicura per la condivisione e collaborazione su documenti per la tua organizzazione
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex items-start space-x-3">
          <FileText className="h-8 w-8 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900">Gestione Documenti</h3>
            <p className="text-gray-600 text-sm">Carica, organizza e condividi documenti in modo sicuro</p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <Users className="h-8 w-8 text-green-600 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900">Collaborazione in Team</h3>
            <p className="text-gray-600 text-sm">Condividi con reparti o utenti specifici</p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <Bell className="h-8 w-8 text-yellow-600 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900">Notifiche Intelligenti</h3>
            <p className="text-gray-600 text-sm">Ricevi notifiche per nuovi documenti e note</p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <Shield className="h-8 w-8 text-red-600 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900">Tracciamento Attività</h3>
            <p className="text-gray-600 text-sm">Tieni traccia di chi legge e scarica i contenuti</p>
          </div>
        </div>
      </div>
    </div>

    {/* Lato destro - Modulo di Login */}
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Accedi</CardTitle>
        <CardDescription>Inserisci le tue credenziali per accedere alla piattaforma</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Inserisci la tua email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Inserisci la tua password"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Accesso in corso..." : "Accedi"}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Credenziali Demo:</p>
          <div className="text-xs space-y-1">
            <p>
              <strong>Admin:</strong> admin@company.com / admin123
            </p>
            <p>
              <strong>Utente:</strong> john.doe@company.com / user123
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</div>

  )
}
