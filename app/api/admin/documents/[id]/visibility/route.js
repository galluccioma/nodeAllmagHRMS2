import { NextResponse } from "next/server"
import db from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user || user.role !== "administrator") {
      return NextResponse.json({ error: "Accesso amministratore richiesto" }, { status: 403 })
    }

    const { id: documentId } = await params
    const { visibilityType, visibilityIds } = await request.json()

    if (!visibilityType || !Array.isArray(visibilityIds)) {
      return NextResponse.json({ error: "Dati di visibilità incompleti" }, { status: 400 })
    }

    // First, remove all existing visibility settings
    await db.execute("DELETE FROM document_department_visibility WHERE document_id = ?", [documentId])
    await db.execute("DELETE FROM document_user_visibility WHERE document_id = ?", [documentId])

    // Then add new visibility settings
    if (visibilityType === "departments") {
      for (const deptId of visibilityIds) {
        await db.execute(
          "INSERT INTO document_department_visibility (document_id, department_id) VALUES (?, ?)",
          [documentId, deptId]
        )
      }
    } else if (visibilityType === "users") {
      for (const userId of visibilityIds) {
        await db.execute(
          "INSERT INTO document_user_visibility (document_id, user_id) VALUES (?, ?)",
          [documentId, userId]
        )
      }
    }

    return NextResponse.json({ message: "Visibilità documento aggiornata con successo" })
  } catch (error) {
    console.error("Errore nell'aggiornamento della visibilità del documento:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
} 