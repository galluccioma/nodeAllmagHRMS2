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

    const [documents] = await db.execute(`
      SELECT d.*, 
             u.first_name as uploader_first_name, 
             u.last_name as uploader_last_name,
             (SELECT COUNT(*) FROM document_read_logs WHERE document_id = d.id) as read_count,
             (SELECT COUNT(*) FROM document_download_logs WHERE document_id = d.id) as download_count
      FROM documents d
      JOIN users u ON d.uploaded_by = u.id
      ORDER BY d.created_at DESC
    `)

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
