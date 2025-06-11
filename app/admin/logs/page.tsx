"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Activity, StickyNote, Download, Eye } from "lucide-react"

interface LogEntry {
  type: string
  timestamp: string
  item_title: string
  first_name: string
  last_name: string
  email: string
  item_id: number
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState("all")

  useEffect(() => {
    fetchLogs()
  }, [filterType])

  const fetchLogs = async () => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch(`/api/admin/logs?type=${filterType}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const getLogIcon = (type: string) => {
    switch (type) {
      case "document_read":
        return <Eye className="h-4 w-4" />
      case "document_download":
        return <Download className="h-4 w-4" />
      case "note_read":
        return <StickyNote className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getLogColor = (type: string) => {
    switch (type) {
      case "document_read":
        return "bg-blue-100 text-blue-800"
      case "document_download":
        return "bg-green-100 text-green-800"
      case "note_read":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatLogType = (type: string) => {
    switch (type) {
      case "document_read":
        return "Documento Letto"
      case "document_download":
        return "Documento Scaricato"
      case "note_read":
        return "Nota Letta"
      default:
        return type
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
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Activity Logs</h1>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Activity Logs</h2>
            <p className="text-gray-600">Monitor user activity across documents and notes</p>
          </div>
          <div className="w-48">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le Attività</SelectItem>
                <SelectItem value="document_reads">Documento Letto</SelectItem>
                <SelectItem value="document_downloads">Documento Scaricato</SelectItem>
                <SelectItem value="note_reads">Nota Letta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {logs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No activity logs found</p>
              </CardContent>
            </Card>
          ) : (
            logs.map((log, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${getLogColor(log.type)}`}>{getLogIcon(log.type)}</div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {log.first_name} {log.last_name}
                          </span>
                          <Badge variant="outline">{formatLogType(log.type)}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {log.type.includes("document") ? "Document" : "Note"}: {log.item_title}
                        </p>
                        <p className="text-xs text-gray-500">{log.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{new Date(log.timestamp).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
