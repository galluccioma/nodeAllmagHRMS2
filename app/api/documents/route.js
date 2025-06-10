import { NextResponse } from "next/server"
import db from "@/lib/database"
import { verifyToken } from "@/lib/auth"
import { saveFile } from "@/lib/file-storage"

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

    // Get documents visible to the user based on multiple departments or direct user visibility
    const [documents] = await db.execute(
      `
      SELECT DISTINCT d.*, 
             u.first_name as uploader_first_name, 
             u.last_name as uploader_last_name,
             CASE 
               WHEN drl.user_id IS NOT NULL THEN TRUE 
               ELSE FALSE 
             END as is_read,
             CASE 
               WHEN ddl.user_id IS NOT NULL THEN TRUE 
               ELSE FALSE 
             END as is_downloaded
      FROM documents d
      JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN document_read_logs drl ON d.id = drl.document_id AND drl.user_id = ?
      LEFT JOIN document_download_logs ddl ON d.id = ddl.document_id AND ddl.user_id = ?
      WHERE d.id IN (
        SELECT DISTINCT doc_id FROM (
          ${departmentIds.length > 0 ? `
          SELECT ddv.document_id as doc_id 
          FROM document_department_visibility ddv 
          WHERE ddv.department_id IN (${departmentIds.map(() => "?").join(",")})
          UNION
          ` : ""}
          SELECT duv.document_id as doc_id 
          FROM document_user_visibility duv 
          WHERE duv.user_id = ?
        ) as visible_docs
      )
      ORDER BY d.created_at DESC
    `,
      [user.id, user.id, ...departmentIds, user.id],
    )

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    console.log('Starting document upload process...')
    
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    console.log('Token received:', token ? 'Yes' : 'No')
    
    const user = verifyToken(token)
    console.log('User verified:', user ? `ID: ${user.id}` : 'No')

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const formData = await request.formData()
    console.log('Form data received:', {
      hasTitle: formData.has('title'),
      hasFile: formData.has('file'),
      hasDescription: formData.has('description'),
      hasDepartmentIds: formData.has('departmentIds'),
      hasUserIds: formData.has('userIds')
    })

    const title = formData.get("title")
    const description = formData.get("description")
    const file = formData.get("file")
    const departmentIds = JSON.parse(formData.get("departmentIds") || "[]")
    const userIds = JSON.parse(formData.get("userIds") || "[]")

    if (!title || !file) {
      return NextResponse.json({ error: "Title and file are required" }, { status: 400 })
    }

    console.log('Starting file upload...')
    // Handle file upload using saveFile
    const fileInfo = await saveFile(file, "documents")
    console.log('File uploaded successfully:', fileInfo)

    console.log('Creating document record in database...')
    // Create the document
    const [result] = await db.execute(
      "INSERT INTO documents (title, description, file_path, file_name, file_size, mime_type, uploaded_by, public_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [title, description, fileInfo.filePath, file.name, file.size, file.type, user.id, fileInfo.publicUrl]
    )
    const documentId = result.insertId
    console.log('Document created with ID:', documentId)

    // Set visibility
    if (departmentIds.length > 0) {
      console.log('Setting department visibility...')
      for (const deptId of departmentIds) {
        await db.execute("INSERT INTO document_department_visibility (document_id, department_id) VALUES (?, ?)", [
          documentId,
          deptId,
        ])
      }
    } else if (userIds.length > 0) {
      console.log('Setting user visibility...')
      for (const userId of userIds) {
        await db.execute("INSERT INTO document_user_visibility (document_id, user_id) VALUES (?, ?)", [
          documentId,
          userId,
        ])
      }
    }

    return NextResponse.json({ id: documentId }, { status: 201 })
  } catch (error) {
    console.error("Error uploading document:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 })
  }
}
