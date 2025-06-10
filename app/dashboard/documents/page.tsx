"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { FileText, Download, Eye, Search, Calendar, User } from "lucide-react"
import DocumentViewModal from "@/components/document-view-modal"

interface Document {
  id: number
  title: string
  description: string
  file_name: string
  uploader_first_name: string
  uploader_last_name: string
  created_at: string
  is_read: boolean
  is_downloaded: boolean
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  useEffect(() => {
    const filtered = documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredDocuments(filtered)
  }, [documents, searchTerm])

  const fetchDocuments = async () => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch("/api/documents", {
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

  const handleDocumentRead = async (documentId: number) => {
    const token = localStorage.getItem("token")
    try {
      await fetch(`/api/documents/${documentId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchDocuments()
    } catch (error) {
      console.error("Errore nel segnare come letto:", error)
    }
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

  const openViewModal = (documentId: number) => {
    setSelectedDocumentId(documentId)
    setShowViewModal(true)
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
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Search and Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">I Tuoi Documenti</h2>
                <p className="text-gray-600">Gestisci e visualizza tutti i documenti condivisi con te</p>
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
                    <p className="text-sm font-medium text-green-600">Letti</p>
                    <p className="text-2xl font-bold text-green-900">{documents.filter((d) => d.is_read).length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Download className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600">Scaricati</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {documents.filter((d) => d.is_downloaded).length}
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
                    {searchTerm ? "Prova a modificare i termini di ricerca" : "Non ci sono documenti disponibili"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredDocuments.map((doc) => (
                <Card
                  key={doc.id}
                  className={`border-0 shadow-sm hover:shadow-md transition-all duration-200 ${!doc.is_read ? "ring-2 ring-blue-100 bg-blue-50/30" : "bg-white"}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => openViewModal(doc.id)}
                              className="text-lg font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors text-left"
                            >
                              {doc.title}
                            </button>
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
                          {!doc.is_read && <Badge className="bg-blue-600 hover:bg-blue-700">Nuovo</Badge>}
                        </div>

                        {doc.description && <p className="text-gray-600 mb-4 line-clamp-2">{doc.description}</p>}

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="px-2 py-1 bg-gray-100 rounded-md font-mono text-xs">{doc.file_name}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant={doc.is_read ? "outline" : "default"}
                          onClick={() => handleDocumentRead(doc.id)}
                          className="min-w-[100px]"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {doc.is_read ? "Letto" : "Segna Letto"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDocumentDownload(doc.id)}
                          className="min-w-[100px] bg-green-600 hover:bg-green-700"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Scarica
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        {selectedDocumentId && (
          <DocumentViewModal
            documentId={selectedDocumentId}
            isOpen={showViewModal}
            onClose={() => setShowViewModal(false)}
            onRefresh={fetchDocuments}
          />
        )}
      </main>
    </div>
  )
}
