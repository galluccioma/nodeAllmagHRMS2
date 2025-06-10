"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { StickyNote, Eye, Search, Calendar, User } from "lucide-react"
import NoteViewModal from "@/components/note-view-modal"

interface Note {
  id: number
  title: string
  content: string
  author_first_name: string
  author_last_name: string
  created_at: string
  is_read: boolean
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedNote, setExpandedNote] = useState<number | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null)

  useEffect(() => {
    fetchNotes()
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
      const response = await fetch("/api/notes", {
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

  const handleNoteRead = async (noteId: number) => {
    const token = localStorage.getItem("token")
    try {
      await fetch(`/api/notes/${noteId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchNotes()
    } catch (error) {
      console.error("Errore nel segnare come letta:", error)
    }
  }

  const toggleNoteExpansion = (noteId: number) => {
    setExpandedNote(expandedNote === noteId ? null : noteId)
  }

  const openViewModal = (noteId: number) => {
    setSelectedNoteId(noteId)
    setShowViewModal(true)
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
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Search and Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Le Tue Note</h2>
                <p className="text-gray-600">Visualizza e gestisci tutte le note condivise con te</p>
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
                    <p className="text-sm font-medium text-blue-600">Lette</p>
                    <p className="text-2xl font-bold text-blue-900">{notes.filter((n) => n.is_read).length}</p>
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
                    {searchTerm ? "Prova a modificare i termini di ricerca" : "Non ci sono note disponibili"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotes.map((note) => (
                <Card
                  key={note.id}
                  className={`border-0 shadow-sm hover:shadow-md transition-all duration-200 ${!note.is_read ? "ring-2 ring-green-100 bg-green-50/30" : "bg-white"}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <StickyNote className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => openViewModal(note.id)}
                              className="text-lg font-semibold text-gray-900 truncate hover:text-green-600 transition-colors text-left"
                            >
                              {note.title}
                            </button>
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
                          {!note.is_read && <Badge className="bg-green-600 hover:bg-green-700">Nuova</Badge>}
                        </div>

                        <div className="prose prose-sm max-w-none">
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
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant={note.is_read ? "outline" : "default"}
                          onClick={() => handleNoteRead(note.id)}
                          className="min-w-[100px]"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {note.is_read ? "Letta" : "Segna Letta"}
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
      {selectedNoteId && (
        <NoteViewModal
          noteId={selectedNoteId}
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          onRefresh={fetchNotes}
        />
      )}
    </div>
  )
}
