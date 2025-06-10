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

    const [notes] = await db.execute(`
      SELECT n.*, 
             u.first_name as author_first_name, 
             u.last_name as author_last_name,
             (SELECT COUNT(*) FROM note_read_logs WHERE note_id = n.id) as read_count
      FROM notes n
      JOIN users u ON n.created_by = u.id
      ORDER BY n.created_at DESC
    `)

    return NextResponse.json(notes)
  } catch (error) {
    console.error("Error fetching notes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
