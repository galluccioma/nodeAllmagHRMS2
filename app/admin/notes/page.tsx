"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { StickyNote, Trash2, Eye, Edit, Search, Calendar, User, Plus } from "lucide-react"
import NoteActivityModal from "@/components/note-activity-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import NoteCreate from "@/components/note-create"

interface Note {
  id: number
  title: string
  content: string
  author_first_name: string
  author_last_name: string
  created_at: string
  read_count: number
}

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

export default function AdminNotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [expandedNote, setExpandedNote] = useState<number | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [users, setUsers] = useState<UserType[]>([])
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    visibilityType: "departments" as "departments" | "users",
    selectedDepartments: [] as number[],
    selectedUsers: [] as number[],
  })

  const [showActivityModal, setShowActivityModal] = useState(false)
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null)
  const [selectedNoteReadCount, setSelectedNoteReadCount] = useState(0)

  useEffect(() => {
    fetchNotes()
    fetchDepartments()
    fetchUsers()
  }, [])

  useEffect(() => {
    const filtered = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${note.author_first_name} ${note.author_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredNotes(filtered)
  }, [notes, searchTerm])

  const fetchNotes = async () => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch("/api/admin/notes", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (error) {
      console.error("Errore nel caricamento delle note:", error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm("Sei sicuro di voler eliminare questa nota?")) return

    const token = localStorage.getItem("token")
    try {
      const response = await fetch(`/api/admin/notes/${noteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Nota eliminata con successo")
        fetchNotes()
      } else {
        setError(data.error || "Errore nell'eliminazione della nota")
      }
    } catch (error) {
      setError("Errore di rete. Riprova.")
    }
  }

  const handleEditNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNote) return

    const visibilityIds =
      formData.visibilityType === "departments" ? formData.selectedDepartments : formData.selectedUsers
    if (visibilityIds.length === 0) {
      setError("Seleziona almeno un dipartimento o utente")
      return
    }

    const token = localStorage.getItem("token")
    try {
      const response = await fetch(`/api/admin/notes/${editingNote.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          visibilityType: formData.visibilityType,
          visibilityIds,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Nota aggiornata con successo")
        setShowEditModal(false)
        setEditingNote(null)
        resetForm()
        fetchNotes()
      } else {
        setError(data.error || "Errore nell'aggiornamento della nota")
      }
    } catch (error) {
      setError("Errore di rete. Riprova.")
    }
  }

  const openEditModal = async (note: Note) => {
    setEditingNote(note)

    // Fetch current note assignments
    const token = localStorage.getItem("token")
    try {
      const response = await fetch(`/api/admin/notes/${note.id}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const assignments = await response.json()
        setFormData({
          title: note.title,
          content: note.content,
          visibilityType: assignments.type || "departments",
          selectedDepartments: assignments.departments || [],
          selectedUsers: assignments.users || [],
        })
      }
    } catch (error) {
      console.error("Error fetching assignments:", error)
      setFormData({
        title: note.title,
        content: note.content,
        visibilityType: "departments",
        selectedDepartments: [],
        selectedUsers: [],
      })
    }

    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      visibilityType: "departments",
      selectedDepartments: [],
      selectedUsers: [],
    })
  }

  const toggleNoteExpansion = (noteId: number) => {
    setExpandedNote(expandedNote === noteId ? null : noteId)
  }

  const openActivityModal = (noteId: number, readCount: number) => {
    setSelectedNoteId(noteId)
    setSelectedNoteReadCount(readCount)
    setShowActivityModal(true)
  }

  const handleEditDepartmentChange = (departmentId: number, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        selectedDepartments: [...formData.selectedDepartments, departmentId],
      })
    } else {
      setFormData({
        ...formData,
        selectedDepartments: formData.selectedDepartments.filter((id) => id !== departmentId),
      })
    }
  }

  const handleEditUserChange = (userId: number, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        selectedUsers: [...formData.selectedUsers, userId],
      })
    } else {
      setFormData({
        ...formData,
        selectedUsers: formData.selectedUsers.filter((id) => id !== userId),
      })
    }
  }

  const handleEditClick = (note: Note) => {
    setEditingNote(note)
    setShowCreateModal(true)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingNote(null)
  }

  const handleSuccess = () => {
    setShowCreateModal(false)
    setEditingNote(null)
    fetchNotes()
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center space-x-3">
            <StickyNote className="h-6 w-6 text-green-600" />
            <h1 className="text-xl font-bold text-gray-900">Note</h1>
          </div>
          <div className="ml-auto">
            <Button onClick={() => setShowCreateModal(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Crea Nota
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Search and Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tutte le Note</h2>
                <p className="text-gray-600">Gestisci tutte le note del sistema</p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca note..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <StickyNote className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600">Totale Note</p>
                    <p className="text-2xl font-bold text-green-900">{notes.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Eye className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600">Totale Letture</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {notes.reduce((sum, note) => sum + note.read_count, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Grid */}
          <div className="grid gap-6">
            {filteredNotes.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <StickyNote className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessuna nota trovata</h3>
                  <p className="text-gray-500">
                    {searchTerm ? "Prova a modificare i termini di ricerca" : "Non ci sono note nel sistema"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotes.map((note) => (
                <Card key={note.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <StickyNote className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{note.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {note.author_first_name} {note.author_last_name}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(note.created_at).toLocaleDateString("it-IT")}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="prose prose-sm max-w-none mb-4">
                          <p
                            className={`text-gray-700 whitespace-pre-wrap ${expandedNote === note.id ? "" : "line-clamp-3"}`}
                          >
                            {note.content}
                          </p>
                          {note.content.length > 200 && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => toggleNoteExpansion(note.id)}
                              className="p-0 h-auto text-blue-600 hover:text-blue-700"
                            >
                              {expandedNote === note.id ? "Mostra meno" : "Mostra tutto"}
                            </Button>
                          )}
                        </div>

                        <div>
                          <Badge
                            variant="secondary"
                            className="cursor-pointer hover:bg-blue-100 transition-colors"
                            onClick={() => openActivityModal(note.id, note.read_count)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {note.read_count} letture
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => handleEditClick(note)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Modifica
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteNote(note.id)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Elimina
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        {selectedNoteId && (
          <NoteActivityModal
            noteId={selectedNoteId}
            isOpen={showActivityModal}
            onClose={() => setShowActivityModal(false)}
            readCount={selectedNoteReadCount}
          />
        )}
      </main>

      {/* Edit Note Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Nota</DialogTitle>
            <DialogDescription>Aggiorna le informazioni della nota e i permessi di visibilità</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditNote} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="edit_title">Titolo *</Label>
              <Input
                id="edit_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Inserisci il titolo della nota"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_content">Contenuto *</Label>
              <Textarea
                id="edit_content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Inserisci il contenuto della nota"
                rows={8}
                required
              />
            </div>

            <div className="space-y-4">
              <Label>Visibilità</Label>
              <Select
                value={formData.visibilityType}
                onValueChange={(value: "departments" | "users") => setFormData({ ...formData, visibilityType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="departments">Condividi con Dipartimenti</SelectItem>
                  <SelectItem value="users">Condividi con Utenti Specifici</SelectItem>
                </SelectContent>
              </Select>

              {formData.visibilityType === "departments" && (
                <div className="space-y-3">
                  <Label>Seleziona Dipartimenti</Label>
                  <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto">
                    {departments.map((dept) => (
                      <div key={dept.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-dept-${dept.id}`}
                          checked={formData.selectedDepartments.includes(dept.id)}
                          onCheckedChange={(checked) => handleEditDepartmentChange(dept.id, checked as boolean)}
                        />
                        <Label htmlFor={`edit-dept-${dept.id}`} className="text-sm">
                          {dept.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.visibilityType === "users" && (
                <div className="space-y-3">
                  <Label>Seleziona Utenti</Label>
                  <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-user-${user.id}`}
                          checked={formData.selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleEditUserChange(user.id, checked as boolean)}
                        />
                        <Label htmlFor={`edit-user-${user.id}`} className="text-sm">
                          {user.first_name} {user.last_name} ({user.department_name || "Nessun dipartimento"})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Annulla
              </Button>
              <Button type="submit">Aggiorna Nota</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {showCreateModal && (
        <NoteCreate
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          noteId={editingNote?.id}
          initialTitle={editingNote?.title}
          initialContent={editingNote?.content}
        />
      )}
    </div>
  )
}
