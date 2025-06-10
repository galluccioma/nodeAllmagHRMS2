import { NextResponse } from "next/server"
import db from "@/lib/database"
import { verifyToken } from "@/lib/auth"
import { saveFile } from "@/lib/file-storage"

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user || user.role !== "administrator") {
      return NextResponse.json({ error: "Accesso amministratore richiesto" }, { status: 403 })
    }

    const formData = await request.formData()
    const title = formData.get("title")
    const description = formData.get("description")
    const file = formData.get("file")
    const visibilityType = formData.get("visibilityType")
    const visibilityIds = JSON.parse(formData.get("visibilityIds") || "[]")

    if (!title || !file) {
      return NextResponse.json({ error: "Titolo e file sono richiesti" }, { status: 400 })
    }

    // Salva il file usando il sistema di storage
    const fileInfo = await saveFile(file, "documents")

    // Salva documento nel database
    const [result] = await db.execute(
      `INSERT INTO documents (title, description, file_path, file_name, file_size, mime_type, uploaded_by, public_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, fileInfo.filePath, file.name, file.size, file.type, user.id, fileInfo.publicUrl],
    )

    const documentId = result.insertId

    // Imposta visibilità
    if (visibilityType === "departments") {
      for (const deptId of visibilityIds) {
        await db.execute("INSERT INTO document_department_visibility (document_id, department_id) VALUES (?, ?)", [
          documentId,
          deptId,
        ])
      }
    } else if (visibilityType === "users") {
      for (const userId of visibilityIds) {
        await db.execute("INSERT INTO document_user_visibility (document_id, user_id) VALUES (?, ?)", [
          documentId,
          userId,
        ])
      }
    }

    return NextResponse.json({ message: "Documento creato con successo", id: documentId }, { status: 201 })
  } catch (error) {
    console.error("Errore nella creazione del documento:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
