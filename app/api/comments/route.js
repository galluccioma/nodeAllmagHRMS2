import { NextResponse } from "next/server"
import db from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: "Autenticazione richiesta" }, { status: 401 })
    }

    const { content, itemType, itemId } = await request.json()

    if (!content || !itemType || !itemId) {
      return NextResponse.json({ error: "Contenuto, tipo e ID dell'elemento sono richiesti" }, { status: 400 })
    }

    if (itemType !== "document" && itemType !== "note") {
      return NextResponse.json({ error: "Tipo di elemento non valido" }, { status: 400 })
    }

    // Check if user has access to this item
    let hasAccess = false
    if (itemType === "document") {
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
        [itemId, user.department_id, user.id],
      )
      hasAccess = access.length > 0
    } else {
      const [access] = await db.execute(
        `
        SELECT 1 FROM notes n
        WHERE n.id = ? AND n.id IN (
          SELECT DISTINCT note_id FROM (
            SELECT ndv.note_id 
            FROM note_department_visibility ndv 
            WHERE ndv.department_id = ?
            UNION
            SELECT nuv.note_id 
            FROM note_user_visibility nuv 
            WHERE nuv.user_id = ?
          ) as visible_notes
        )
      `,
        [itemId, user.department_id, user.id],
      )
      hasAccess = access.length > 0
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 })
    }

    // Update last access time
    await db.execute("UPDATE users SET last_access = CURRENT_TIMESTAMP WHERE id = ?", [user.id])

    // Insert comment
    const [result] = await db.execute(
      `INSERT INTO comments (content, user_id, item_type, item_id) VALUES (?, ?, ?, ?)`,
      [content, user.id, itemType, itemId],
    )

    return NextResponse.json({ message: "Commento aggiunto con successo", id: result.insertId }, { status: 201 })
  } catch (error) {
    console.error("Errore nell'aggiunta del commento:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: "Autenticazione richiesta" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const itemType = searchParams.get("itemType")
    const itemId = searchParams.get("itemId")

    if (!itemType || !itemId) {
      return NextResponse.json({ error: "Tipo e ID dell'elemento sono richiesti" }, { status: 400 })
    }

    // Check if user is admin or has access to this item
    let hasAccess = user.role === "administrator"

    if (!hasAccess) {
      if (itemType === "document") {
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
          [itemId, user.department_id, user.id],
        )
        hasAccess = access.length > 0
      } else {
        const [access] = await db.execute(
          `
          SELECT 1 FROM notes n
          WHERE n.id = ? AND n.id IN (
            SELECT DISTINCT note_id FROM (
              SELECT ndv.note_id 
              FROM note_department_visibility ndv 
              WHERE ndv.department_id = ?
              UNION
              SELECT nuv.note_id 
              FROM note_user_visibility nuv 
              WHERE nuv.user_id = ?
            ) as visible_notes
          )
        `,
          [itemId, user.department_id, user.id],
        )
        hasAccess = access.length > 0
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 })
    }

    // Get comments
    const [comments] = await db.execute(
      `
      SELECT c.*, u.first_name, u.last_name, u.email
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.item_type = ? AND c.item_id = ?
      ORDER BY c.created_at DESC
    `,
      [itemType, itemId],
    )

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Errore nel recupero dei commenti:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
