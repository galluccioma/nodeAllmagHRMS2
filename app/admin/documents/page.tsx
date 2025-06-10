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
import { FileText, Trash2, Download, Eye, Edit, Search, Calendar, User, Upload, Activity, Pencil } from "lucide-react"
import DocumentActivityModal from "@/components/document-activity-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import DocumentUpload from "@/components/document-upload"

interface Department {
  id: number
  name: string
}

interface AppUser {
  id: number
  first_name: string
  last_name: string
  email: string
  department_name: string
}

interface Document {
  id: number
  title: string
  description: string
  file_name: string
  uploader_first_name: string
  uploader_last_name: string
  created_at: string
  read_count: number
  download_count: number
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showEditModal, setShowEditModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    visibilityType: "departments" as "departments" | "users",
    selectedDepartments: [] as number[],
    selectedUsers: [] as number[],
  })

  const [showActivityModal, setShowActivityModal] = useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null)
  const [selectedDocumentStats, setSelectedDocumentStats] = useState({ readCount: 0, downloadCount: 0 })

  useEffect(() => {
    fetchDocuments()
    fetchDepartments()
    fetchUsers()
  }, [])

  useEffect(() => {
    const filtered = documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${doc.uploader_first_name} ${doc.uploader_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredDocuments(filtered)
  }, [documents, searchTerm])

  const fetchDocuments = async () => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch("/api/admin/documents", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error("Errore nel caricamento dei documenti:", error)
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

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm("Sei sicuro di voler eliminare questo documento?")) return

    const token = localStorage.getItem("token")
    try {
      const response = await fetch(`/api/admin/documents/${documentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Documento eliminato con successo")
        fetchDocuments()
      } else {
        setError(data.error || "Errore nell'eliminazione del documento")
      }
    } catch (error) {
      setError("Errore di rete. Riprova.")
    }
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

  const handleEditDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDocument) return

    const visibilityIds =
      formData.visibilityType === "departments" ? formData.selectedDepartments : formData.selectedUsers
    if (visibilityIds.length === 0) {
      setError("Seleziona almeno un dipartimento o utente")
      return
    }

    const token = localStorage.getItem("token")
    try {
      const response = await fetch(`/api/admin/documents/${editingDocument.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          visibilityType: formData.visibilityType,
          visibilityIds,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Documento aggiornato con successo")
        setShowEditModal(false)
        setEditingDocument(null)
        resetForm()
        fetchDocuments()
      } else {
        setError(data.error || "Errore nell'aggiornamento del documento")
      }
    } catch (error) {
      setError("Errore di rete. Riprova.")
    }
  }

  const openEditModal = async (document: Document) => {
    setEditingDocument(document)

    // Fetch current document assignments
    const token = localStorage.getItem("token")
    try {
      const response = await fetch(`/api/admin/documents/${document.id}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const assignments = await response.json()
        setFormData({
          title: document.title,
          description: document.description || "",
          visibilityType: assignments.type || "departments",
          selectedDepartments: assignments.departments || [],
          selectedUsers: assignments.users || [],
        })
      }
    } catch (error) {
      console.error("Error fetching assignments:", error)
      setFormData({
        title: document.title,
        description: document.description || "",
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
      description: "",
      visibilityType: "departments",
      selectedDepartments: [],
      selectedUsers: [],
    })
  }

  const openActivityModal = (documentId: number, readCount: number, downloadCount: number) => {
    setSelectedDocumentId(documentId)
    setSelectedDocumentStats({ readCount, downloadCount })
    setShowActivityModal(true)
  }

  const handleEditClick = (document: Document) => {
    setEditingDocument(document)
    setShowCreateModal(true)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingDocument(null)
  }

  const handleSuccess = () => {
    setShowCreateModal(false)
    setEditingDocument(null)
    fetchDocuments()
  }

  const handleDocumentDownload = async (documentId: number) => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch(`/api/documents/${documentId}/download`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        // Open the download URL in a new tab
        window.open(data.downloadUrl, '_blank')
        fetchDocuments()
      } else {
        console.error("Error initiating download")
      }
    } catch (error) {
      console.error("Errore nel download:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Documenti</h1>
          </div>
          <div className="ml-auto">
            <Button onClick={() => setShowUploadModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              Carica Documento
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tutti i Documenti</h2>
                <p className="text-gray-600">Gestisci tutti i documenti del sistema</p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca documenti..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600">Totale Documenti</p>
                    <p className="text-2xl font-bold text-blue-900">{documents.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Eye className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600">Totale Letture</p>
                    <p className="text-2xl font-bold text-green-900">
                      {documents.reduce((sum, doc) => sum + doc.read_count, 0)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Download className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600">Totale Download</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {documents.reduce((sum, doc) => sum + doc.download_count, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Grid */}
          <div className="grid gap-6">
            {filteredDocuments.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessun documento trovato</h3>
                  <p className="text-gray-500">
                    {searchTerm ? "Prova a modificare i termini di ricerca" : "Non ci sono documenti nel sistema"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredDocuments.map((doc) => (
                <Card key={doc.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{doc.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {doc.uploader_first_name} {doc.uploader_last_name}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(doc.created_at).toLocaleDateString("it-IT")}
                              </div>
                            </div>
                          </div>
                        </div>

                        {doc.description && <p className="text-gray-600 mb-4 line-clamp-2">{doc.description}</p>}

                        <div className="flex items-center gap-4">
                          <span className="px-2 py-1 bg-gray-100 rounded-md font-mono text-xs">{doc.file_name}</span>
                          <div className="flex gap-3">
                            <Badge
                              variant="secondary"
                              className="cursor-pointer hover:bg-blue-100 transition-colors"
                              onClick={() => openActivityModal(doc.id, doc.read_count, doc.download_count)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              {doc.read_count} letture
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="cursor-pointer hover:bg-green-100 transition-colors"
                              onClick={() => openActivityModal(doc.id, doc.read_count, doc.download_count)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              {doc.download_count} download
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => openEditModal(doc)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Modifica
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteDocument(doc.id)}>
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
      </main>

      {selectedDocumentId && (
        <DocumentActivityModal
          documentId={selectedDocumentId}
          isOpen={showActivityModal}
          onClose={() => setShowActivityModal(false)}
          readCount={selectedDocumentStats.readCount}
          downloadCount={selectedDocumentStats.downloadCount}
        />
      )}

      {/* Edit Document Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Documento</DialogTitle>
            <DialogDescription>Aggiorna le informazioni del documento e i permessi di visibilità</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditDocument} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="edit_title">Titolo *</Label>
              <Input
                id="edit_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Inserisci il titolo del documento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_description">Descrizione</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Inserisci la descrizione del documento (opzionale)"
                rows={3}
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
              <Button type="submit">Aggiorna Documento</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {showUploadModal && (
        <DocumentUpload
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            fetchDocuments()
          }}
        />
      )}

      {showCreateModal && (
        <DocumentUpload
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          documentId={editingDocument?.id}
          initialTitle={editingDocument?.title}
          initialDescription={editingDocument?.description}
        />
      )}
    </div>
  )
}
