import { NextResponse } from "next/server"
import db from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const [users] = await db.execute(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.role, 
             u.department_id, d.name as department_name, u.is_active
      FROM users u 
      LEFT JOIN departments d ON u.department_id = d.id 
      WHERE u.is_active = TRUE
      ORDER BY u.first_name, u.last_name
    `)

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
