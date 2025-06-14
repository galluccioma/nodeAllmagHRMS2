"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Download, User, Calendar, Building2 } from "lucide-react"

interface ActivityLog {
  read_at?: string
  downloaded_at?: string
  user_id: number
  first_name: string
  last_name: string
  email: string
  department_name?: string
}

interface DocumentActivityModalProps {
  documentId: number
  isOpen: boolean
  onClose: () => void
  readCount: number
  downloadCount: number
}

export default function DocumentActivityModal({
  documentId,
  isOpen,
  onClose,
  readCount,
  downloadCount,
}: DocumentActivityModalProps) {
  const [reads, setReads] = useState<ActivityLog[]>([])
  const [downloads, setDownloads] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && documentId) {
      fetchActivity()
    }
  }, [isOpen, documentId])

  const fetchActivity = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")
    try {
      const response = await fetch(`/api/admin/documents/${documentId}/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setReads(data.reads)
        setDownloads(data.downloads)
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attività Documento</DialogTitle>
          <DialogDescription>Visualizza chi ha letto e scaricato questo documento</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Tabs defaultValue="reads" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reads">
                Letture ({reads.length})
              </TabsTrigger>
              <TabsTrigger value="downloads">
                Download ({downloads.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reads" className="mt-4">
              {reads.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nessuna lettura registrata</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reads.map((read, index) => {
                    const { date, time } = formatDateTime(read.read_at || '')
                    return (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {read.first_name} {read.last_name}
                              </h4>
                              <p className="text-sm text-gray-500">{read.email}</p>
                              {read.department_name && (
                                <p className="text-sm text-gray-500">{read.department_name}</p>
                              )}
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
            </TabsContent>

            <TabsContent value="downloads" className="mt-4">
              {downloads.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nessun download registrato</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {downloads.map((download, index) => {
                    const { date, time } = formatDateTime(download.downloaded_at || '')
                    return (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {download.first_name} {download.last_name}
                              </h4>
                              <p className="text-sm text-gray-500">{download.email}</p>
                              {download.department_name && (
                                <p className="text-sm text-gray-500">{download.department_name}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Calendar className="h-4 w-4" />
                                {date}
                              </div>
                              <p className="text-xs text-gray-500">{time}</p>
                              <Badge variant="secondary" className="mt-1">
                                ID: {download.user_id}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
