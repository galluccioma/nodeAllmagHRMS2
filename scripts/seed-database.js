import mysql from "mysql2/promise"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })
dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "node2",
  port: Number.parseInt(process.env.DB_PORT) || 3306,
}

async function seedDatabase() {
  let connection

  try {
    console.log("🔄 Connessione al database per seeding...")
    connection = await mysql.createConnection(dbConfig)

    console.log("🌱 Inizio seeding del database...")

    // Check if data already exists
    const [existingUsers] = await connection.execute("SELECT COUNT(*) as count FROM users")
    if (existingUsers[0].count > 0) {
      console.log("⚠️  Il database contiene già dati. Saltando il seeding.")
      return
    }

    // Create departments
    console.log("📁 Creazione dipartimenti...")
    const departments = ["Human Resources", "Information Technology", "Finance", "Marketing", "Operations"]

    const departmentIds = []
    for (const dept of departments) {
      const [result] = await connection.execute("INSERT INTO departments (name) VALUES (?)", [dept])
      departmentIds.push(result.insertId)
      console.log(`✅ Dipartimento creato: ${dept}`)
    }

    // Create admin user
    console.log("👤 Creazione utente amministratore...")
    const adminPassword = await bcrypt.hash("admin123", 10)
    const [adminResult] = await connection.execute(
      `
      INSERT INTO users (first_name, last_name, email, password, role, is_active) 
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      ["Admin", "User", "admin@company.com", adminPassword, "admin", 1],
    )

    // Assign admin to IT department
    await connection.execute(
      "INSERT INTO user_departments (user_id, department_id) VALUES (?, ?)",
      [adminResult.insertId, departmentIds[1]], // IT department
    )
    console.log("✅ Amministratore creato: admin@company.com / admin123")

    // Create sample users
    console.log("👥 Creazione utenti di esempio...")
    const sampleUsers = [
      { firstName: "Mario", lastName: "Rossi", email: "mario.rossi@company.com", deptIndex: 0 },
      { firstName: "Giulia", lastName: "Bianchi", email: "giulia.bianchi@company.com", deptIndex: 1 },
      { firstName: "Luca", lastName: "Verdi", email: "luca.verdi@company.com", deptIndex: 2 },
      { firstName: "Anna", lastName: "Neri", email: "anna.neri@company.com", deptIndex: 3 },
      { firstName: "Paolo", lastName: "Gialli", email: "paolo.gialli@company.com", deptIndex: 4 },
    ]

    const userPassword = await bcrypt.hash("password123", 10)

    for (const user of sampleUsers) {
      const [userResult] = await connection.execute(
        `
        INSERT INTO users (first_name, last_name, email, password, role, is_active) 
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [user.firstName, user.lastName, user.email, userPassword, "user", 1],
      )

      // Assign user to department
      await connection.execute("INSERT INTO user_departments (user_id, department_id) VALUES (?, ?)", [
        userResult.insertId,
        departmentIds[user.deptIndex],
      ])

      console.log(`✅ Utente creato: ${user.email} / password123`)
    }

    // Create sample documents
    console.log("📄 Creazione documenti di esempio...")
    const sampleDocuments = [
      {
        title: "Manuale Dipendenti 2024",
        description: "Guida completa per tutti i dipendenti dell'azienda",
        fileName: "manuale-dipendenti-2024.pdf",
      },
      {
        title: "Politiche di Sicurezza IT",
        description: "Linee guida per la sicurezza informatica aziendale",
        fileName: "politiche-sicurezza-it.pdf",
      },
      {
        title: "Budget Annuale 2024",
        description: "Pianificazione finanziaria per l'anno corrente",
        fileName: "budget-2024.xlsx",
      },
    ]

    for (const doc of sampleDocuments) {
      const [docResult] = await connection.execute(
        `
        INSERT INTO documents (title, description, file_name, file_path, uploader_id, created_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
      `,
        [doc.title, doc.description, doc.fileName, `/uploads/documents/${doc.fileName}`, adminResult.insertId],
      )

      // Assign to all departments
      for (const deptId of departmentIds) {
        await connection.execute("INSERT INTO document_departments (document_id, department_id) VALUES (?, ?)", [
          docResult.insertId,
          deptId,
        ])
      }

      console.log(`✅ Documento creato: ${doc.title}`)
    }

    // Create sample notes
    console.log("📝 Creazione note di esempio...")
    const sampleNotes = [
      {
        title: "Benvenuto nel Sistema",
        content:
          "Benvenuti nel nuovo sistema di gestione documenti e note. Questo strumento vi permetterà di accedere facilmente a tutti i documenti aziendali e condividere informazioni importanti con i vostri colleghi.",
      },
      {
        title: "Aggiornamento Procedure",
        content:
          "Si comunica che a partire dal prossimo mese entreranno in vigore le nuove procedure operative. Tutti i dipendenti sono invitati a prendere visione dei documenti aggiornati nella sezione dedicata.",
      },
      {
        title: "Manutenzione Sistema",
        content:
          "Programmata manutenzione del sistema per il weekend. Durante questo periodo potrebbero verificarsi brevi interruzioni del servizio. Ci scusiamo per il disagio.",
      },
    ]

    for (const note of sampleNotes) {
      const [noteResult] = await connection.execute(
        `
        INSERT INTO notes (title, content, author_id, created_at) 
        VALUES (?, ?, ?, NOW())
      `,
        [note.title, note.content, adminResult.insertId],
      )

      // Assign to all departments
      for (const deptId of departmentIds) {
        await connection.execute("INSERT INTO note_departments (note_id, department_id) VALUES (?, ?)", [
          noteResult.insertId,
          deptId,
        ])
      }

      console.log(`✅ Nota creata: ${note.title}`)
    }

    console.log("🎉 Seeding completato con successo!")
    console.log("")
    console.log("📋 Credenziali di accesso:")
    console.log("   Admin: admin@company.com / admin123")
    console.log("   Utenti: [nome].[cognome]@company.com / password123")
    console.log("")
  } catch (error) {
    console.error("❌ Errore durante il seeding:", error.message)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

seedDatabase()
