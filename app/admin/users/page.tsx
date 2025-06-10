"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, Plus, Edit, Trash2, Shield, User, Building } from "lucide-react"

interface UserType {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  last_access: string
  departments?: Department[]
}

interface Department {
  id: number
  name: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserType[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "user",
    department_ids: [] as number[],
    is_active: true,
  })

  useEffect(() => {
    fetchUsers()
    fetchDepartments()
  }, [])

  const fetchUsers = async () => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()

        // Fetch departments for each user
        const usersWithDepartments = await Promise.all(
          data.map(async (user: UserType) => {
            const deptResponse = await fetch(`/api/admin/users/${user.id}/departments`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (deptResponse.ok) {
              const departments = await deptResponse.json()
              return { ...user, departments }
            }
            return user
          }),
        )

        setUsers(usersWithDepartments)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    const token = localStorage.getItem("token")
    try {
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const token = localStorage.getItem("token")
    try {
      // Create user first
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          is_active: formData.is_active,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Assign departments
        if (formData.department_ids.length > 0) {
          await fetch(`/api/admin/users/${data.id}/departments`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ departmentIds: formData.department_ids }),
          })
        }

        setSuccess("Utente creato con successo")
        setShowCreateModal(false)
        resetForm()
        fetchUsers()
      } else {
        setError(data.error || "Errore nella creazione dell'utente")
      }
    } catch (error) {
      setError("Errore di rete. Riprova.")
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setError("")
    setSuccess("")

    const token = localStorage.getItem("token")
    try {
      // Update user info
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          is_active: formData.is_active,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Update departments
        await fetch(`/api/admin/users/${editingUser.id}/departments`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ departmentIds: formData.department_ids }),
        })

        setSuccess("Utente aggiornato con successo")
        setShowEditModal(false)
        setEditingUser(null)
        resetForm()
        fetchUsers()
      } else {
        setError(data.error || "Errore nell'aggiornamento dell'utente")
      }
    } catch (error) {
      setError("Errore di rete. Riprova.")
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Sei sicuro di voler eliminare questo utente?")) return

    const token = localStorage.getItem("token")
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Utente eliminato con successo")
        fetchUsers()
      } else {
        setError(data.error || "Errore nell'eliminazione dell'utente")
      }
    } catch (error) {
      setError("Errore di rete. Riprova.")
    }
  }

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      role: "user",
      department_ids: [],
      is_active: true,
    })
  }

  const openEditModal = (user: UserType) => {
    setEditingUser(user)
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: "",
      role: user.role,
      department_ids: user.departments?.map((d) => d.id) || [],
      is_active: user.is_active,
    })
    setShowEditModal(true)
  }

  const handleDepartmentToggle = (departmentId: number) => {
    setFormData((prev) => ({
      ...prev,
      department_ids: prev.department_ids.includes(departmentId)
        ? prev.department_ids.filter((id) => id !== departmentId)
        : [...prev.department_ids, departmentId],
    }))
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Gestione Utenti</h1>
        </div>
      </header>

      <main className="flex-1 p-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Utenti</h2>
            <p className="text-gray-600">Gestisci gli utenti del sistema e i loro permessi</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Utente
          </Button>
        </div>

        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {user.first_name} {user.last_name}
                      </h3>
                      <Badge variant={user.role === "administrator" ? "default" : "secondary"}>
                        {user.role === "administrator" ? (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3 mr-1" />
                            Utente
                          </>
                        )}
                      </Badge>
                      <Badge variant={user.is_active ? "default" : "destructive"}>
                        {user.is_active ? "Attivo" : "Inattivo"}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{user.email}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">Dipartimenti:</span>
                      {user.departments && user.departments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.departments.map((dept) => (
                            <Badge key={dept.id} variant="outline" className="text-xs">
                              {dept.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Nessun dipartimento</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Creato: {new Date(user.created_at).toLocaleDateString("it-IT")}
                    </p>
                    <p className="text-sm text-gray-500">
                      Ultimo accesso: {user.last_access ? new Date(user.last_access).toLocaleDateString("it-IT", {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : "Mai"}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(user)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Modifica
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Elimina
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create User Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crea Nuovo Utente</DialogTitle>
              <DialogDescription>Aggiungi un nuovo utente al sistema</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Nome</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Cognome</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="role">Ruolo</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utente</SelectItem>
                    <SelectItem value="administrator">Amministratore</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Dipartimenti</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dept-${dept.id}`}
                        checked={formData.department_ids.includes(dept.id)}
                        onCheckedChange={() => handleDepartmentToggle(dept.id)}
                      />
                      <Label htmlFor={`dept-${dept.id}`} className="text-sm">
                        {dept.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Annulla
                </Button>
                <Button type="submit">Crea Utente</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit User Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifica Utente</DialogTitle>
              <DialogDescription>Aggiorna le informazioni dell'utente</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_first_name">Nome</Label>
                  <Input
                    id="edit_first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_last_name">Cognome</Label>
                  <Input
                    id="edit_last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit_password">Password (lascia vuoto per mantenere quella attuale)</Label>
                <Input
                  id="edit_password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Lascia vuoto per mantenere la password attuale"
                />
              </div>

              <div>
                <Label htmlFor="edit_role">Ruolo</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utente</SelectItem>
                    <SelectItem value="administrator">Amministratore</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Dipartimenti</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-dept-${dept.id}`}
                        checked={formData.department_ids.includes(dept.id)}
                        onCheckedChange={() => handleDepartmentToggle(dept.id)}
                      />
                      <Label htmlFor={`edit-dept-${dept.id}`} className="text-sm">
                        {dept.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="edit_status">Stato</Label>
                <Select
                  value={formData.is_active ? "true" : "false"}
                  onValueChange={(value) => setFormData({ ...formData, is_active: value === "true" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Attivo</SelectItem>
                    <SelectItem value="false">Inattivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  Annulla
                </Button>
                <Button type="submit">Aggiorna Utente</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
