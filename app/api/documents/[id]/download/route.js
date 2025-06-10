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

    // Get document details including public URL
    const [documents] = await db.execute(
      "SELECT public_url FROM documents WHERE id = ?",
      [documentId]
    )

    if (documents.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const document = documents[0]

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

    // Log the download activity
    await db.execute("INSERT INTO document_download_logs (document_id, user_id) VALUES (?, ?)", [documentId, user.id])

    // Return the public URL for the file
    return NextResponse.json({ 
      message: "Download logged successfully",
      downloadUrl: document.public_url 
    })
  } catch (error) {
    console.error("Error logging document download:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
