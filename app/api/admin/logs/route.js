import { NextResponse } from "next/server"
import db from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user || user.role !== "administrator") {
      return NextResponse.json({ error: "Administrator access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all"

    let logs = []

    if (type === "all" || type === "document_reads") {
      const [documentReads] = await db.execute(`
        SELECT 'document_read' as type, drl.read_at as timestamp, 
               d.title as item_title, u.first_name, u.last_name, u.email,
               drl.document_id as item_id
        FROM document_read_logs drl
        JOIN documents d ON drl.document_id = d.id
        JOIN users u ON drl.user_id = u.id
        ORDER BY drl.read_at DESC
        LIMIT 100
      `)
      logs = [...logs, ...documentReads]
    }

    if (type === "all" || type === "document_downloads") {
      const [documentDownloads] = await db.execute(`
        SELECT 'document_download' as type, ddl.downloaded_at as timestamp, 
               d.title as item_title, u.first_name, u.last_name, u.email,
               ddl.document_id as item_id
        FROM document_download_logs ddl
        JOIN documents d ON ddl.document_id = d.id
        JOIN users u ON ddl.user_id = u.id
        ORDER BY ddl.downloaded_at DESC
        LIMIT 100
      `)
      logs = [...logs, ...documentDownloads]
    }

    if (type === "all" || type === "note_reads") {
      const [noteReads] = await db.execute(`
        SELECT 'note_read' as type, nrl.read_at as timestamp, 
               n.title as item_title, u.first_name, u.last_name, u.email,
               nrl.note_id as item_id
        FROM note_read_logs nrl
        JOIN notes n ON nrl.note_id = n.id
        JOIN users u ON nrl.user_id = u.id
        ORDER BY nrl.read_at DESC
        LIMIT 100
      `)
      logs = [...logs, ...noteReads]
    }

    // Sort all logs by timestamp
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    return NextResponse.json(logs.slice(0, 200))
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
