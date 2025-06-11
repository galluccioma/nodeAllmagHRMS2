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

    const { id: userId } = await params

    const [departments] = await db.execute(
      `SELECT d.id, d.name 
       FROM departments d
       JOIN user_departments ud ON d.id = ud.department_id
       WHERE ud.user_id = ?`,
      [userId]
    )

    return NextResponse.json(departments)
  } catch (error) {
    console.error("Errore nel recupero dei dipartimenti dell'utente:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user || user.role !== "administrator") {
      return NextResponse.json({ error: "Accesso amministratore richiesto" }, { status: 403 })
    }

    const { id: userId } = await params
    const { departmentIds } = await request.json()

    if (!Array.isArray(departmentIds)) {
      return NextResponse.json({ error: "Formato dati non valido" }, { status: 400 })
    }

    // Delete existing department assignments
    await db.execute("DELETE FROM user_departments WHERE user_id = ?", [userId])

    // Insert new department assignments one by one
    if (departmentIds.length > 0) {
      for (const deptId of departmentIds) {
        await db.execute(
          "INSERT INTO user_departments (user_id, department_id) VALUES (?, ?)",
          [userId, deptId]
        )
      }
    }

    return NextResponse.json({ message: "Dipartimenti aggiornati con successo" })
  } catch (error) {
    console.error("Errore nell'aggiornamento dei dipartimenti dell'utente:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
