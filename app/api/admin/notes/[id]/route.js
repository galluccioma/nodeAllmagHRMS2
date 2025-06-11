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

    const noteId = params.id
    const { title, content } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: "Titolo e contenuto sono obbligatori" }, { status: 400 })
    }

    await db.execute("UPDATE notes SET title = ?, content = ? WHERE id = ?", [title, content, noteId])

    return NextResponse.json({ message: "Nota aggiornata con successo" })
  } catch (error) {
    console.error("Errore nell'aggiornamento della nota:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user || user.role !== "administrator") {
      return NextResponse.json({ error: "Accesso amministratore richiesto" }, { status: 403 })
    }

    const { id: noteId } = await params

    await db.execute("DELETE FROM notes WHERE id = ?", [noteId])

    return NextResponse.json({ message: "Nota eliminata con successo" })
  } catch (error) {
    console.error("Errore nell'eliminazione della nota:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
