import { NextResponse } from "next/server"
import db from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function POST(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { id: noteId } = await params

    // Check if user has access to this note
    const [access] = await db.execute(
      `
      SELECT 1 FROM notes n
      WHERE n.id = ? AND n.id IN (
        SELECT DISTINCT note_id FROM (
          SELECT ndv.note_id 
          FROM note_department_visibility ndv 
          WHERE ndv.department_id = ?
          UNION
          SELECT nuv.note_id 
          FROM note_user_visibility nuv 
          WHERE nuv.user_id = ?
        ) as visible_notes
      )
    `,
      [noteId, user.department_id, user.id],
    )

    if (access.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Log the read activity
    await db.execute("INSERT INTO note_read_logs (note_id, user_id) VALUES (?, ?)", [noteId, user.id])
    
    // Update last access time
    await db.execute("UPDATE users SET last_access = CURRENT_TIMESTAMP WHERE id = ?", [user.id])

    return NextResponse.json({ message: "Read logged successfully" })
  } catch (error) {
    console.error("Error logging note read:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
