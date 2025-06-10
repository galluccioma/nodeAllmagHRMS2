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

    const { userId, departmentId } = await request.json()

    if (!userId || !departmentId) {
      return NextResponse.json({ error: "ID utente e ID dipartimento sono richiesti" }, { status: 400 })
    }

    await db.execute("UPDATE users SET department_id = ? WHERE id = ?", [departmentId, userId])

    return NextResponse.json({ message: "Utente assegnato al dipartimento con successo" })
  } catch (error) {
    console.error("Errore nell'assegnazione dell'utente al dipartimento:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
