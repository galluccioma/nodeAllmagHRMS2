"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Calendar, User } from "lucide-react"

interface Document {
  id: number
  title: string
  description: string
  file_name: string
  file_size: number
  mime_type: string
  uploader_first_name: string
  uploader_last_name: string
  created_at: string
  is_read: boolean
  is_downloaded: boolean
}

interface DocumentViewModalProps {
  documentId: number
  isOpen: boolean
  onClose: () => void
  onRefresh?: () => void
}

export default function DocumentViewModal({ documentId, isOpen, onClose, onRefresh }: DocumentViewModalProps) {
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && documentId) {
      fetchDocument()
    }
  }, [isOpen, documentId])

  const fetchDocument = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setDocument(data)
      }
    } catch (error) {
      console.error("Errore nel caricamento del documento:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentRead = async () => {
    const token = localStorage.getItem("token")
    try {
      await fetch(`/api/documents/${documentId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchDocument()
      onRefresh?.()
    } catch (error) {
      console.error("Errore nel segnare come letto:", error)
    }
  }

  const handleDocumentDownload = async () => {
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
        fetchDocument()
        onRefresh?.()
      } else {
        console.error("Error initiating download")
      }
    } catch (error) {
      console.error("Errore nel download:", error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Visualizza Documento
          </DialogTitle>
          <DialogDescription>Dettagli completi del documento</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : document ? (
          <div className="space-y-6">
            {/* Header with status */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{document.title}</h2>
                <div className="flex items-center gap-2 mb-4">
                  {!document.is_read && <Badge className="bg-blue-600">Nuovo</Badge>}
                  {document.is_read && <Badge variant="outline">Letto</Badge>}
                  {document.is_downloaded && <Badge variant="outline">Scaricato</Badge>}
                </div>
              </div>
            </div>

            {/* Description */}
            {document.description && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Descrizione</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{document.description}</p>
              </div>
            )}

            {/* File Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">Informazioni File</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Nome File</p>
                  <p className="text-blue-900 font-mono text-sm">{document.file_name}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Dimensione</p>
                  <p className="text-blue-900">{formatFileSize(document.file_size)}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Tipo</p>
                  <p className="text-blue-900">{document.mime_type}</p>
                </div>
              </div>
            </div>

            {/* Author and Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Dettagli Caricamento</h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Caricato da</p>
                    <p className="font-medium text-gray-900">
                      {document.uploader_first_name} {document.uploader_last_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Data</p>
                    <p className="font-medium text-gray-900">
                      {new Date(document.created_at).toLocaleDateString("it-IT", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleDocumentRead}
                variant={document.is_read ? "outline" : "default"}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                {document.is_read ? "Già Letto" : "Segna come Letto"}
              </Button>
              <Button onClick={handleDocumentDownload} className="flex-1 bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Scarica
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Documento non trovato</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
