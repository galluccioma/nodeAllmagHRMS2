import { NextResponse } from "next/server"
import db from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function POST(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const documentId = params.id

    // Check if user has access to this document
    const [access] = await db.execute(
      `
      SELECT 1 FROM documents d
      WHERE d.id = ? AND d.id IN (
        SELECT DISTINCT doc_id FROM (
          SELECT ddv.document_id as doc_id 
          FROM document_department_visibility ddv 
          WHERE ddv.department_id = ?
          UNION
          SELECT duv.document_id as doc_id 
          FROM document_user_visibility duv 
          WHERE duv.user_id = ?
        ) as visible_docs
      )
    `,
      [documentId, user.department_id, user.id],
    )

    if (access.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Log the read activity
    await db.execute("INSERT INTO document_read_logs (document_id, user_id) VALUES (?, ?)", [documentId, user.id])
    
    // Update last access time
    await db.execute("UPDATE users SET last_access = CURRENT_TIMESTAMP WHERE id = ?", [user.id])

    return NextResponse.json({ message: "Read logged successfully" })
  } catch (error) {
    console.error("Error logging document read:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
