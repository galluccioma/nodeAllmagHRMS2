import mysql from "mysql2/promise"
import dotenv from "dotenv"

// Load environment variables from both .env.local and .env
dotenv.config({ path: ".env.local" })
dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "main",
  port: Number.parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
}

// Create connection pool
const pool = mysql.createPool(dbConfig)

// Test connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log("✅ Database connesso con successo")
    connection.release()
  } catch (error) {
    console.error("❌ Errore connessione database:", error.message)
    console.error("🔧 Verifica le configurazioni in .env.local:")
    console.error(`   DB_HOST: ${process.env.DB_HOST}`)
    console.error(`   DB_USER: ${process.env.DB_USER}`)
    console.error(`   DB_NAME: ${process.env.DB_NAME}`)
    console.error(`   DB_PORT: ${process.env.DB_PORT}`)
  }
}

// Test connection when module is loaded
testConnection()

export default pool
