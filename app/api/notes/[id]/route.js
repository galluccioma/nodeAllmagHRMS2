import { NextResponse } from "next/server"
import db from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function GET(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: "Autenticazione richiesta" }, { status: 401 })
    }

    const noteId = params.id

    // Check if user has access to this note
    const [access] = await db.execute(
      `
      SELECT n.*, u.first_name as author_first_name, u.last_name as author_last_name,
             CASE 
               WHEN nrl.user_id IS NOT NULL THEN TRUE 
               ELSE FALSE 
             END as is_read
      FROM notes n
      JOIN users u ON n.created_by = u.id
      LEFT JOIN note_read_logs nrl ON n.id = nrl.note_id AND nrl.user_id = ?
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
      [user.id, noteId, user.department_id, user.id],
    )

    if (access.length === 0) {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 })
    }

    return NextResponse.json(access[0])
  } catch (error) {
    console.error("Errore nel recupero della nota:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const noteId = params.id
    const { title, content, departmentIds, userIds } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    // Update the note
    await db.execute(
      "UPDATE notes SET title = ?, content = ? WHERE id = ? AND created_by = ?",
      [title, content, noteId, user.id]
    )

    // Delete existing visibility settings
    await db.execute("DELETE FROM note_department_visibility WHERE note_id = ?", [noteId])
    await db.execute("DELETE FROM note_user_visibility WHERE note_id = ?", [noteId])

    // Assign department visibility
    if (Array.isArray(departmentIds) && departmentIds.length > 0) {
      await Promise.all(
        departmentIds.map(deptId =>
          db.execute(
            "INSERT INTO note_department_visibility (note_id, department_id) VALUES (?, ?)",
            [noteId, deptId]
          )
        )
      )
    }

    // Assign user visibility
    if (Array.isArray(userIds) && userIds.length > 0) {
      await Promise.all(
        userIds.map(userId =>
          db.execute(
            "INSERT INTO note_user_visibility (note_id, user_id) VALUES (?, ?)",
            [noteId, userId]
          )
        )
      )
    }

    return NextResponse.json({ message: "Note updated successfully" })
  } catch (error) {
    console.error("Error updating note:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
