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

    const documentId = params.id

    // Get read logs
    const [readLogs] = await db.execute(
      `
      SELECT drl.read_at, u.id as user_id, u.first_name, u.last_name, u.email, d.name as department_name
      FROM document_read_logs drl
      JOIN users u ON drl.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE drl.document_id = ?
      ORDER BY drl.read_at DESC
    `,
      [documentId],
    )

    // Get latest download per user
    const [downloadLogs] = await db.execute(
      `
      SELECT ddl.downloaded_at, u.id as user_id, u.first_name, u.last_name, u.email, d.name as department_name
      FROM document_download_logs ddl
      JOIN users u ON ddl.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE ddl.document_id = ?
      AND ddl.downloaded_at = (
        SELECT MAX(downloaded_at)
        FROM document_download_logs
        WHERE document_id = ddl.document_id
        AND user_id = ddl.user_id
      )
      ORDER BY ddl.downloaded_at DESC
    `,
      [documentId],
    )

    return NextResponse.json({
      reads: readLogs,
      downloads: downloadLogs,
    })
  } catch (error) {
    console.error("Errore nel recupero dell'attività del documento:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
