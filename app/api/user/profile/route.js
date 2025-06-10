import { NextResponse } from "next/server"
import db from "@/lib/database"
import { verifyToken, hashPassword, comparePassword } from "@/lib/auth"

export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: "Autenticazione richiesta" }, { status: 401 })
    }

    const [userData] = await db.execute(
      `
      SELECT u.id, u.first_name, u.last_name, u.email, u.role, 
             u.department_id, d.name as department_name
      FROM users u 
      LEFT JOIN departments d ON u.department_id = d.id 
      WHERE u.id = ?
    `,
      [user.id],
    )

    if (userData.length === 0) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    return NextResponse.json(userData[0])
  } catch (error) {
    console.error("Errore nel recupero del profilo:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: "Autenticazione richiesta" }, { status: 401 })
    }

    const { first_name, last_name, email, current_password, new_password } = await request.json()

    if (!first_name || !last_name || !email) {
      return NextResponse.json({ error: "Nome, cognome e email sono richiesti" }, { status: 400 })
    }

    // Check if email is already in use by another user
    const [existingUsers] = await db.execute("SELECT id FROM users WHERE email = ? AND id != ?", [email, user.id])
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Email già in uso" }, { status: 409 })
    }

    // If changing password, verify current password
    if (new_password) {
      if (!current_password) {
        return NextResponse.json({ error: "Password attuale richiesta" }, { status: 400 })
      }

      const [userData] = await db.execute("SELECT password_hash FROM users WHERE id = ?", [user.id])
      if (userData.length === 0) {
        return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
      }

      const isValidPassword = await comparePassword(current_password, userData[0].password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ error: "Password attuale non valida" }, { status: 401 })
      }

      // Update user with new password
      const hashedPassword = await hashPassword(new_password)
      await db.execute("UPDATE users SET first_name = ?, last_name = ?, email = ?, password_hash = ? WHERE id = ?", [
        first_name,
        last_name,
        email,
        hashedPassword,
        user.id,
      ])
    } else {
      // Update user without changing password
      await db.execute("UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?", [
        first_name,
        last_name,
        email,
        user.id,
      ])
    }

    return NextResponse.json({ message: "Profilo aggiornato con successo" })
  } catch (error) {
    console.error("Errore nell'aggiornamento del profilo:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
