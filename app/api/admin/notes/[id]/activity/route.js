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

    const noteId = params.id

    // Get read logs
    const [readLogs] = await db.execute(
      `
      SELECT nrl.read_at, u.id as user_id, u.first_name, u.last_name, u.email, d.name as department_name
      FROM note_read_logs nrl
      JOIN users u ON nrl.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE nrl.note_id = ?
      ORDER BY nrl.read_at DESC
    `,
      [noteId],
    )

    return NextResponse.json({
      reads: readLogs,
    })
  } catch (error) {
    console.error("Errore nel recupero dell'attività della nota:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
