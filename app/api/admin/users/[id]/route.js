import { NextResponse } from "next/server"
import db from "@/lib/database"
import { verifyToken, hashPassword } from "@/lib/auth"

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user || user.role !== "administrator") {
      return NextResponse.json({ error: "Administrator access required" }, { status: 403 })
    }

    const userId = params.id
    const { first_name, last_name, email, password, role, department_id, is_active } = await request.json()

    if (!first_name || !last_name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    let updateQuery = `
      UPDATE users 
      SET first_name = ?, last_name = ?, email = ?, role = ?, department_id = ?, is_active = ?
    `
    const params_array = [first_name, last_name, email, role, department_id === undefined ? null : department_id, is_active]

    if (password) {
      const hashedPassword = await hashPassword(password)
      updateQuery += `, password_hash = ?`
      params_array.push(hashedPassword)
    }

    updateQuery += ` WHERE id = ?`
    params_array.push(userId)

    await db.execute(updateQuery, params_array)

    return NextResponse.json({ message: "User updated successfully" })
  } catch (error) {
    console.error("Error updating user:", error)
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

    const userId = params.id

    // Don't allow deleting yourself
    if (Number.parseInt(userId) === user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    await db.execute("DELETE FROM users WHERE id = ?", [userId])

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
