import { NextResponse } from "next/server"
import db from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user || user.role !== "administrator") {
      return NextResponse.json({ error: "Administrator access required" }, { status: 403 })
    }

    const [departments] = await db.execute(
      `SELECT d.*, COUNT(u.id) as user_count 
       FROM departments d 
       LEFT JOIN users u ON d.id = u.department_id AND u.is_active = TRUE
       GROUP BY d.id 
       ORDER BY d.name`,
    )

    return NextResponse.json(departments)
  } catch (error) {
    console.error("Error fetching departments:", error)
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

    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Department name is required" }, { status: 400 })
    }

    const [result] = await db.execute("INSERT INTO departments (name) VALUES (?)", [name])

    return NextResponse.json({ message: "Department created successfully", id: result.insertId }, { status: 201 })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Department name already exists" }, { status: 409 })
    }
    console.error("Error creating department:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
