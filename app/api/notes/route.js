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

    // Get user's departments
    const [userDepartments] = await db.execute("SELECT department_id FROM user_departments WHERE user_id = ?", [
      user.id,
    ])

    const departmentIds = userDepartments.map((ud) => ud.department_id)

    // Get notes visible to the user based on multiple departments or direct user visibility
    const [notes] = await db.execute(
      `
      SELECT DISTINCT n.*, 
             u.first_name as author_first_name, 
             u.last_name as author_last_name,
             CASE 
               WHEN nrl.user_id IS NOT NULL THEN TRUE 
               ELSE FALSE 
             END as is_read
      FROM notes n
      JOIN users u ON n.created_by = u.id
      LEFT JOIN note_read_logs nrl ON n.id = nrl.note_id AND nrl.user_id = ?
      WHERE n.id IN (
        SELECT DISTINCT note_id FROM (
          ${departmentIds.length > 0 ? `
          SELECT ndv.note_id 
          FROM note_department_visibility ndv 
          WHERE ndv.department_id IN (${departmentIds.map(() => "?").join(",")})
          UNION
          ` : ""}
          SELECT nuv.note_id 
          FROM note_user_visibility nuv 
          WHERE nuv.user_id = ?
        ) as visible_notes
      )
      ORDER BY n.created_at DESC
    `,
      [user.id, ...departmentIds, user.id],
    )

    return NextResponse.json(notes)
  } catch (error) {
    console.error("Error fetching notes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { title, content, departmentIds, userIds } = await request.json()
    console.log("Request body:", { title, content, departmentIds, userIds })

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    // Create the note
    const [result] = await db.execute(
      "INSERT INTO notes (title, content, created_by) VALUES (?, ?, ?)",
      [title, content, user.id]
    )
    const noteId = result.insertId

    // Assign department visibility
    if (Array.isArray(departmentIds) && departmentIds.length > 0) {
      await Promise.all(
        departmentIds.map(deptId =>
          db.execute(
            "INSERT INTO note_department_visibility (note_id, department_id) VALUES (?, ?)",
            [noteId, deptId]
          )
        )
      )
    }

    // Assign user visibility
    if (Array.isArray(userIds) && userIds.length > 0) {
      await Promise.all(
        userIds.map(async userId => {
          try {
            await db.execute(
              "INSERT INTO note_user_visibility (note_id, user_id) VALUES (?, ?)",
              [noteId, userId]
            )
          } catch (err) {
            console.error(`Error inserting user visibility for user ${userId}:`, err)
          }
        })
      )
    }

    return NextResponse.json({ message: "Note created successfully", id: noteId }, { status: 201 })
  } catch (error) {
    console.error("Error creating note:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
