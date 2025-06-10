"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, User } from "lucide-react"

interface Department {
  id: number
  name: string
}

interface UserType {
  id: number
  first_name: string
  last_name: string
  email: string
  department_name: string
}

interface NoteAssignModalProps {
  noteId: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function NoteAssignModal({ noteId, isOpen, onClose, onSuccess }: NoteAssignModalProps) {
  const [visibilityType, setVisibilityType] = useState<"departments" | "users">("departments")
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([])
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      fetchDepartments()
      fetchUsers()
      fetchCurrentVisibility()
    }
  }, [isOpen, noteId])

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

  const fetchCurrentVisibility = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      // Fetch current department visibility
      const deptResponse = await fetch(`/api/admin/notes/${noteId}/visibility/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (deptResponse.ok) {
        const deptData = await deptResponse.json()
        setSelectedDepartments(deptData.map((d: { department_id: number }) => d.department_id))

        // If departments are assigned, set visibility type to departments
        if (deptData.length > 0) {
          setVisibilityType("departments")
        }
      }

      // Fetch current user visibility
      const userResponse = await fetch(`/api/admin/notes/${noteId}/visibility/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setSelectedUsers(userData.map((u: { user_id: number }) => u.user_id))

        // If users are assigned and no departments, set visibility type to users
        if (userData.length > 0 && selectedDepartments.length === 0) {
          setVisibilityType("users")
        }
      }
    } catch (error) {
      console.error("Error fetching current visibility:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

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
      const response = await fetch("/api/admin/notes/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          noteId,
          visibilityType,
          visibilityIds,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
      } else {
        setError(data.error || "Errore nell'assegnazione della nota")
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assegna Nota</DialogTitle>
          <DialogDescription>Modifica i permessi di visibilità per questa nota</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Label>Visibilità</Label>
            <Select value={visibilityType} onValueChange={(value: "departments" | "users") => setVisibilityType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="departments">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Condividi con Dipartimenti</span>
                  </div>
                </SelectItem>
                <SelectItem value="users">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Condividi con Utenti Specifici</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {visibilityType === "departments" && (
              <div className="space-y-3">
                <Label>Seleziona Dipartimenti</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-md p-3">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-md p-3">
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
                  Salvataggio...
                </>
              ) : (
                "Salva Assegnazioni"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
