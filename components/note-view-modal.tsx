"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StickyNote, Eye, Calendar, User } from "lucide-react"

interface Note {
  id: number
  title: string
  content: string
  author_first_name: string
  author_last_name: string
  created_at: string
  is_read: boolean
}

interface NoteViewModalProps {
  noteId: number
  isOpen: boolean
  onClose: () => void
  onRefresh?: () => void
}

export default function NoteViewModal({ noteId, isOpen, onClose, onRefresh }: NoteViewModalProps) {
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && noteId) {
      fetchNote()
    }
  }, [isOpen, noteId])

  const fetchNote = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setNote(data)
      }
    } catch (error) {
      console.error("Errore nel caricamento della nota:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleNoteRead = async () => {
    const token = localStorage.getItem("token")
    try {
      await fetch(`/api/notes/${noteId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchNote()
      onRefresh?.()
    } catch (error) {
      console.error("Errore nel segnare come letta:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-green-600" />
            Visualizza Nota
          </DialogTitle>
          <DialogDescription>Contenuto completo della nota</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : note ? (
          <div className="space-y-6">
            {/* Header with status */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{note.title}</h2>
                <div className="flex items-center gap-2 mb-4">
                  {!note.is_read && <Badge className="bg-green-600">Nuova</Badge>}
                  {note.is_read && <Badge variant="outline">Letta</Badge>}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Contenuto</h3>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
              </div>
            </div>

            {/* Author and Date */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3">Dettagli Creazione</h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600">Creata da</p>
                    <p className="font-medium text-green-900">
                      {note.author_first_name} {note.author_last_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600">Data</p>
                    <p className="font-medium text-green-900">
                      {new Date(note.created_at).toLocaleDateString("it-IT", {
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
              <Button onClick={handleNoteRead} variant={note.is_read ? "outline" : "default"} className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                {note.is_read ? "Già Letta" : "Segna come Letta"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Nota non trovata</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
