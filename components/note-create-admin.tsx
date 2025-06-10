"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus } from "lucide-react"

interface Department {
  id: number
  name: string
}

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  department_name: string
}

interface NoteCreateAdminProps {
  onClose: () => void
  onSuccess: () => void
}

export default function NoteCreateAdmin({ onClose, onSuccess }: NoteCreateAdminProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [visibilityType, setVisibilityType] = useState<"departments" | "users">("departments")
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([])
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchDepartments()
    fetchUsers()
  }, [])

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/admin/departments", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      }
    } catch (error) {
      console.error("Error fetching departments:", error)
    }
  }

  const fetchUsers = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const response = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!title || !content) {
      setError("Titolo e contenuto sono obbligatori")
      setLoading(false)
      return
    }

    const visibilityIds = visibilityType === "departments" ? selectedDepartments : selectedUsers
    if (visibilityIds.length === 0) {
      setError("Seleziona almeno un dipartimento o utente")
      setLoading(false)
      return
    }

    const token = localStorage.getItem("token")
    if (!token) {
      setError("Autenticazione richiesta")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          visibilityType,
          visibilityIds,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
      } else {
        setError(data.error || "Errore nella creazione della nota")
      }
    } catch (error) {
      setError("Errore di rete. Riprova.")
    } finally {
      setLoading(false)
    }
  }

  const handleDepartmentChange = (departmentId: number, checked: boolean) => {
    if (checked) {
      setSelectedDepartments([...selectedDepartments, departmentId])
    } else {
      setSelectedDepartments(selectedDepartments.filter((id) => id !== departmentId))
    }
  }

  const handleUserChange = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crea Nota</DialogTitle>
          <DialogDescription>Crea una nuova nota e imposta i permessi di visibilità</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Titolo *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Inserisci il titolo della nota"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Contenuto *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Inserisci il contenuto della nota"
              rows={8}
              required
            />
          </div>

          <div className="space-y-4">
            <Label>Visibilità</Label>
            <Select value={visibilityType} onValueChange={(value: "departments" | "users") => setVisibilityType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="departments">Condividi con Dipartimenti</SelectItem>
                <SelectItem value="users">Condividi con Utenti Specifici</SelectItem>
              </SelectContent>
            </Select>

            {visibilityType === "departments" && (
              <div className="space-y-3">
                <Label>Seleziona Dipartimenti</Label>
                <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dept-${dept.id}`}
                        checked={selectedDepartments.includes(dept.id)}
                        onCheckedChange={(checked) => handleDepartmentChange(dept.id, checked as boolean)}
                      />
                      <Label htmlFor={`dept-${dept.id}`} className="text-sm">
                        {dept.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {visibilityType === "users" && (
              <div className="space-y-3">
                <Label>Seleziona Utenti</Label>
                <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => handleUserChange(user.id, checked as boolean)}
                      />
                      <Label htmlFor={`user-${user.id}`} className="text-sm">
                        {user.first_name} {user.last_name} ({user.department_name || "Nessun dipartimento"})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creazione...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Crea Nota
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
