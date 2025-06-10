import { NextResponse } from "next/server"
import db from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user || user.role !== "administrator") {
      return NextResponse.json({ error: "Administrator access required" }, { status: 403 })
    }

    const departmentId = params.id
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Department name is required" }, { status: 400 })
    }

    await db.execute("UPDATE departments SET name = ? WHERE id = ?", [name, departmentId])

    return NextResponse.json({ message: "Department updated successfully" })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Department name already exists" }, { status: 409 })
    }
    console.error("Error updating department:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user || user.role !== "administrator") {
      return NextResponse.json({ error: "Administrator access required" }, { status: 403 })
    }

    const departmentId = params.id

    // Check if department has users
    const [users] = await db.execute("SELECT COUNT(*) as count FROM users WHERE department_id = ?", [departmentId])

    if (users[0].count > 0) {
      return NextResponse.json(
        { error: "Cannot delete department with existing users. Please reassign users first." },
        { status: 400 },
      )
    }

    await db.execute("DELETE FROM departments WHERE id = ?", [departmentId])

    return NextResponse.json({ message: "Department deleted successfully" })
  } catch (error) {
    console.error("Error deleting department:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
