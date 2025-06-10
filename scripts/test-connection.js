import mysql from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function testConnection() {
  const config = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "main",
    port: Number.parseInt(process.env.DB_PORT) || 3306,
    multipleStatements: true // Allow multiple SQL statements
  }

  console.log("Testing connection with config:", {
    host: config.host,
    user: config.user,
    password: config.password ? "***set***" : "not set",
  })

  try {
    const connection = await mysql.createConnection(config)
    console.log("✅ Connection successful!")
    await connection.end()
  } catch (error) {
    console.error("❌ Connection failed:", error.message)
  }
}

testConnection()
