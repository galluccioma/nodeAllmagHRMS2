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

    const [notifications] = await db.execute(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      [user.id],
    )

    // Update last access time
    await db.execute("UPDATE users SET last_access = CURRENT_TIMESTAMP WHERE id = ?", [user.id])

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
