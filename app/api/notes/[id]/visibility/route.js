import { NextResponse } from "next/server"
import db from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function GET(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const noteId = params.id

    // Get department visibility
    const [departmentVisibility] = await db.execute(
      "SELECT department_id FROM note_department_visibility WHERE note_id = ?",
      [noteId]
    )

    // Get user visibility
    const [userVisibility] = await db.execute(
      "SELECT user_id FROM note_user_visibility WHERE note_id = ?",
      [noteId]
    )

    return NextResponse.json({
      departmentIds: departmentVisibility.map(dv => dv.department_id),
      userIds: userVisibility.map(uv => uv.user_id)
    })
  } catch (error) {
    console.error("Error fetching note visibility:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 