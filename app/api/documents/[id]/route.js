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

    const { id: documentId } = await params

    // Check if user has access to this document
    const [access] = await db.execute(
      `
      SELECT d.*, u.first_name as uploader_first_name, u.last_name as uploader_last_name,
             CASE 
               WHEN drl.user_id IS NOT NULL THEN TRUE 
               ELSE FALSE 
             END as is_read,
             CASE 
               WHEN ddl.user_id IS NOT NULL THEN TRUE 
               ELSE FALSE 
             END as is_downloaded
      FROM documents d
      JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN document_read_logs drl ON d.id = drl.document_id AND drl.user_id = ?
      LEFT JOIN document_download_logs ddl ON d.id = ddl.document_id AND ddl.user_id = ?
      WHERE d.id = ? AND d.id IN (
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
    `,
      [user.id, user.id, documentId, user.department_id, user.id],
    )

    if (access.length === 0) {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 })
    }

    return NextResponse.json(access[0])
  } catch (error) {
    console.error("Errore nel recupero del documento:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
