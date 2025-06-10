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
import { Upload } from "lucide-react"

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

interface DocumentUploadAdminProps {
  onClose: () => void
  onSuccess: () => void
}

export default function DocumentUploadAdmin({ onClose, onSuccess }: DocumentUploadAdminProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
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

    if (!title || !file) {
      setError("Titolo e file sono obbligatori")
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
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      formData.append("file", file)
      formData.append("visibilityType", visibilityType)
      formData.append("visibilityIds", JSON.stringify(visibilityIds))

      const response = await fetch("/api/admin/documents/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
      } else {
        setError(data.error || "Caricamento fallito")
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
          <DialogTitle>Carica Documento</DialogTitle>
          <DialogDescription>Carica un nuovo documento e imposta i permessi di visibilità</DialogDescription>
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
              placeholder="Inserisci il titolo del documento"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Inserisci la descrizione del documento (opzionale)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">File *</Label>
            <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
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
                  Caricamento...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Carica Documento
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
