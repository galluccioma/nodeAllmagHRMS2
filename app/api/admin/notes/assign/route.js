import { NextResponse } from "next/server"
import db from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user || user.role !== "administrator") {
      return NextResponse.json({ error: "Accesso amministratore richiesto" }, { status: 403 })
    }

    const { noteId, visibilityType, visibilityIds } = await request.json()

    if (!noteId || !visibilityType || !Array.isArray(visibilityIds) || visibilityIds.length === 0) {
      return NextResponse.json({ error: "Dati di assegnazione incompleti" }, { status: 400 })
    }

    // First, remove all existing visibility settings
    await db.execute("DELETE FROM note_department_visibility WHERE note_id = ?", [noteId])
    await db.execute("DELETE FROM note_user_visibility WHERE note_id = ?", [noteId])

    // Then add new visibility settings
    if (visibilityType === "departments") {
      for (const deptId of visibilityIds) {
        await db.execute("INSERT INTO note_department_visibility (note_id, department_id) VALUES (?, ?)", [
          noteId,
          deptId,
        ])
      }
    } else if (visibilityType === "users") {
      for (const userId of visibilityIds) {
        await db.execute("INSERT INTO note_user_visibility (note_id, user_id) VALUES (?, ?)", [noteId, userId])
      }
    }

    return NextResponse.json({ message: "Nota assegnata con successo" })
  } catch (error) {
    console.error("Errore nell'assegnazione della nota:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
