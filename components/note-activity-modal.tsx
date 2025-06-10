"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, User, Calendar, Building2 } from "lucide-react"

interface ActivityLog {
  read_at: string
  user_id: number
  first_name: string
  last_name: string
  email: string
  department_name: string
}

interface NoteActivityModalProps {
  noteId: number
  isOpen: boolean
  onClose: () => void
  readCount: number
}

export default function NoteActivityModal({ noteId, isOpen, onClose, readCount }: NoteActivityModalProps) {
  const [reads, setReads] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && noteId) {
      fetchActivity()
    }
  }, [isOpen, noteId])

  const fetchActivity = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")
    try {
      const response = await fetch(`/api/admin/notes/${noteId}/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setReads(data.reads)
      }
    } catch (error) {
      console.error("Errore nel caricamento dell'attività:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("it-IT"),
      time: date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attività Nota</DialogTitle>
          <DialogDescription>Visualizza chi ha letto questa nota</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Letture ({readCount})</h3>
            </div>

            {reads.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nessuna lettura registrata</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {reads.map((read, index) => {
                  const { date, time } = formatDateTime(read.read_at)
                  return (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-full">
                              <User className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {read.first_name} {read.last_name}
                              </p>
                              <p className="text-sm text-gray-500">{read.email}</p>
                              {read.department_name && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Building2 className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-400">{read.department_name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              {date}
                            </div>
                            <p className="text-xs text-gray-500">{time}</p>
                            <Badge variant="secondary" className="mt-1">
                              ID: {read.user_id}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
