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
    const { title, description } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Il titolo è obbligatorio" }, { status: 400 })
    }

    await db.execute("UPDATE documents SET title = ?, description = ? WHERE id = ?", [
      title,
      description || null,
      documentId,
    ])

    return NextResponse.json({ message: "Documento aggiornato con successo" })
  } catch (error) {
    console.error("Errore nell'aggiornamento del documento:", error)
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

    const { id: documentId } = await params

    await db.execute("DELETE FROM documents WHERE id = ?", [documentId])

    return NextResponse.json({ message: "Documento eliminato con successo" })
  } catch (error) {
    console.error("Errore nell'eliminazione del documento:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
