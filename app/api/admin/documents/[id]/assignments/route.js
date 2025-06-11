import { NextResponse } from "next/server"
import db from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function GET(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user || user.role !== "administrator") {
      return NextResponse.json({ error: "Accesso amministratore richiesto" }, { status: 403 })
    }

    const { id: documentId } = await params

    // Get department visibility
    const [departmentVisibility] = await db.execute(
      "SELECT department_id FROM document_department_visibility WHERE document_id = ?",
      [documentId]
    )

    // Get user visibility
    const [userVisibility] = await db.execute(
      "SELECT user_id FROM document_user_visibility WHERE document_id = ?",
      [documentId]
    )

    // Determine visibility type based on which assignments exist
    let visibilityType = "departments"
    if (departmentVisibility.length === 0 && userVisibility.length > 0) {
      visibilityType = "users"
    }

    return NextResponse.json({
      type: visibilityType,
      departments: departmentVisibility.map(dv => dv.department_id),
      users: userVisibility.map(uv => uv.user_id)
    })
  } catch (error) {
    console.error("Errore nel recupero delle assegnazioni:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
