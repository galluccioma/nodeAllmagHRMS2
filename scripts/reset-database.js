import mysql from "mysql2/promise"
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

async function resetDatabase() {
  let connection

  try {
    console.log("🔄 Connessione al database...")
    connection = await mysql.createConnection(dbConfig)

    const dbName = process.env.DB_NAME || "node2"

    console.log(`⚠️  ATTENZIONE: Stai per eliminare completamente il database "${dbName}"`)
    console.log("⏳ Attendo 3 secondi prima di procedere...")

    await new Promise((resolve) => setTimeout(resolve, 3000))

    console.log(`🗑️  Eliminazione database "${dbName}"...`)
    await connection.execute(`DROP DATABASE IF EXISTS \`${dbName}\``)

    console.log(`✅ Database "${dbName}" eliminato con successo`)
    console.log('💡 Esegui "npm run db:migrate:seed" per ricreare il database')
  } catch (error) {
    console.error("❌ Errore durante il reset:", error.message)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

resetDatabase()
