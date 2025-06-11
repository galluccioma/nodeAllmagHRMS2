import { NextResponse } from "next/server"
import db from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function GET(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user || user.role !== "administrator") {
      return NextResponse.json({ error: "Accesso amministratore richiesto" }, { status: 403 })
    }

    const { id: noteId } = await params

    // Get department assignments
    const [departmentRows] = await db.execute(`SELECT department_id FROM note_department_visibility WHERE note_id = ?`, [
      noteId,
    ])

    // Get user assignments
    const [userRows] = await db.execute(`SELECT user_id FROM note_user_visibility WHERE note_id = ?`, [noteId])

    const departments = departmentRows.map((row) => row.department_id)
    const users = userRows.map((row) => row.user_id)

    // Determine the primary type based on what has more assignments
    const type = departments.length >= users.length ? "departments" : "users"

    return NextResponse.json({
      type,
      departments,
      users,
    })
  } catch (error) {
    console.error("Errore nel recupero delle assegnazioni:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
