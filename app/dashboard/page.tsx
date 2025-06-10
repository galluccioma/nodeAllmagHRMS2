"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, StickyNote, Bell, Users, LogOut, Eye, Download } from "lucide-react"

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
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
  is_read: boolean
  is_downloaded: boolean
}

interface Note {
  id: number
  title: string
  content: string
  author_first_name: string
  author_last_name: string
  created_at: string
  is_read: boolean
}

interface Notification {
  id: number
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/")
      return
    }

    setUser(JSON.parse(userData))
    fetchData()
  }, [router])

  const fetchData = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const [docsRes, notesRes, notificationsRes] = await Promise.all([
        fetch("/api/documents", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/notes", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (docsRes.ok) {
        const docsData = await docsRes.json()
        setDocuments(docsData)
      }

      if (notesRes.ok) {
        const notesData = await notesRes.json()
        setNotes(notesData)
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json()
        setNotifications(notificationsData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  const handleDocumentRead = async (documentId: number) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await fetch(`/api/documents/${documentId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchData() // Refresh data
    } catch (error) {
      console.error("Error logging document read:", error)
    }
  }

  const handleDocumentDownload = async (documentId: number) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await fetch(`/api/documents/${documentId}/download`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchData() // Refresh data
    } catch (error) {
      console.error("Error logging document download:", error)
    }
  }

  const handleNoteRead = async (noteId: number) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await fetch(`/api/notes/${noteId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchData() // Refresh data
    } catch (error) {
      console.error("Error logging note read:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const unreadNotifications = notifications.filter((n) => !n.is_read).length
  const unreadDocuments = documents.filter((d) => !d.is_read).length
  const unreadNotes = notes.filter((n) => !n.is_read).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Pannello di Controllo</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Benvenuto, {user.first_name} {user.last_name}
                <Badge variant="secondary" className="ml-2">
                  {user.role}
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                {unreadNotifications > 0 && (
                  <Badge variant="destructive" className="relative">
                    <Bell className="h-4 w-4 mr-1" />
                    {unreadNotifications}
                  </Badge>
                )}

                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Documenti</p>
                  <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                  {unreadDocuments > 0 && <p className="text-sm text-red-600">{unreadDocuments} unread</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <StickyNote className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Note</p>
                  <p className="text-2xl font-bold text-gray-900">{notes.length}</p>
                  {unreadNotes > 0 && <p className="text-sm text-red-600">{unreadNotes} unread</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Notifiche</p>
                  <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
                  {unreadNotifications > 0 && <p className="text-sm text-red-600">{unreadNotifications} unread</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Dipartimento</p>
                  <p className="text-lg font-bold text-gray-900">{user.department_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList>
            <TabsTrigger value="documents">
              Documenti
              {unreadDocuments > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {unreadDocuments}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notes">
              Note
              {unreadNotes > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {unreadNotes}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              Notifiche
              {unreadNotifications > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {unreadNotifications}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <div className="grid gap-4">
              {documents.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nessun documento disponibile</p>
                  </CardContent>
                </Card>
              ) : (
                documents.map((doc) => (
                  <Card key={doc.id} className={!doc.is_read ? "border-blue-200 bg-blue-50" : ""}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold">{doc.title}</h3>
                            {!doc.is_read && <Badge variant="destructive">New</Badge>}
                          </div>
                          {doc.description && <p className="text-gray-600 mb-2">{doc.description}</p>}
                          <div className="text-sm text-gray-500">
                            <p>File: {doc.file_name}</p>
                            <p>
                              Uploaded by: {doc.uploader_first_name} {doc.uploader_last_name}
                            </p>
                            <p>Date: {new Date(doc.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleDocumentRead(doc.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            {doc.is_read ? "Read" : "Mark Read"}
                          </Button>
                          <Button size="sm" onClick={() => handleDocumentDownload(doc.id)}>
                            <Download className="h-4 w-4 mr-1" />
                            {doc.is_downloaded ? "Downloaded" : "Download"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes">
            <div className="grid gap-4">
              {notes.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <StickyNote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nessuna nota disponibile</p>
                  </CardContent>
                </Card>
              ) : (
                notes.map((note) => (
                  <Card key={note.id} className={!note.is_read ? "border-green-200 bg-green-50" : ""}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold">{note.title}</h3>
                            {!note.is_read && <Badge variant="destructive">New</Badge>}
                          </div>
                          <p className="text-gray-700 mb-4 whitespace-pre-wrap">{note.content}</p>
                          <div className="text-sm text-gray-500">
                            <p>
                              Created by: {note.author_first_name} {note.author_last_name}
                            </p>
                            <p>Date: {new Date(note.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div>
                          <Button size="sm" variant="outline" onClick={() => handleNoteRead(note.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            {note.is_read ? "Read" : "Mark Read"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="grid gap-4">
              {notifications.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nessuna notifica</p>
                  </CardContent>
                </Card>
              ) : (
                notifications.map((notification) => (
                  <Card key={notification.id} className={!notification.is_read ? "border-yellow-200 bg-yellow-50" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Bell
                          className={`h-5 w-5 mt-1 ${notification.is_read ? "text-gray-400" : "text-yellow-600"}`}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{notification.title}</h4>
                          <p className="text-gray-600 text-sm">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <Badge variant="destructive" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
