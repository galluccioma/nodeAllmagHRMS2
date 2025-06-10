import { NextResponse } from "next/server"
import db from "@/lib/database"
import { hashPassword, generateToken } from "@/lib/auth"

export async function POST(request) {
  try {
    const { first_name, last_name, email, password, department_id, role = "user" } = await request.json()

    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if user already exists
    const [existingUsers] = await db.execute("SELECT id FROM users WHERE email = ?", [email])

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)

    const [result] = await db.execute(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, department_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, hashedPassword, role, department_id],
    )

    const [newUser] = await db.execute(
      `SELECT u.*, d.name as department_name 
       FROM users u 
       LEFT JOIN departments d ON u.department_id = d.id 
       WHERE u.id = ?`,
      [result.insertId],
    )

    const user = newUser[0]
    const token = generateToken(user)

    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          department_id: user.department_id,
          department_name: user.department_name,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
