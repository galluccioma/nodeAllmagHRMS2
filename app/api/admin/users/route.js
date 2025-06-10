import { NextResponse } from "next/server"
import db from "@/lib/database"
import { verifyToken, hashPassword } from "@/lib/auth"

export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user || user.role !== "administrator") {
      return NextResponse.json({ error: "Administrator access required" }, { status: 403 })
    }

    const [users] = await db.execute(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.role, 
             u.department_id, d.name as department_name, u.is_active, u.created_at, u.last_access
      FROM users u 
      LEFT JOIN departments d ON u.department_id = d.id 
      ORDER BY u.created_at DESC
    `)

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user || user.role !== "administrator") {
      return NextResponse.json({ error: "Administrator access required" }, { status: 403 })
    }

    const { first_name, last_name, email, password, role, department_id } = await request.json()

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
      [first_name, last_name, email, hashedPassword, role || "user", department_id],
    )

    return NextResponse.json({ message: "User created successfully", id: result.insertId }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
