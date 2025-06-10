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

    const documentId = params.id

    // Verifica accesso al documento
    const [access] = await db.execute(
      `
      SELECT d.* FROM documents d
      WHERE d.id = ? AND (
        d.id IN (
          SELECT DISTINCT doc_id FROM (
            SELECT ddv.document_id as doc_id 
            FROM document_department_visibility ddv 
            WHERE ddv.department_id = ?
            UNION
            SELECT duv.document_id as doc_id 
            FROM document_user_visibility duv 
            WHERE duv.user_id = ?
          ) as visible_docs
        )
        OR ? = 'administrator'
      )
    `,
      [documentId, user.department_id, user.id, user.role],
    )

    if (access.length === 0) {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 })
    }

    const document = access[0]

    // Registra il download
    await db.execute("INSERT INTO document_download_logs (document_id, user_id) VALUES (?, ?)", [documentId, user.id])

    // Se il documento ha un URL pubblico, reindirizza
    if (document.public_url) {
      return NextResponse.redirect(document.public_url)
    }

    // Se non c'è un URL pubblico, restituisci un errore
    return NextResponse.json({ error: "File non disponibile" }, { status: 404 })
  } catch (error) {
    console.error("Errore nel download del documento:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
