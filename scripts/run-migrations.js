import mysql from "mysql2/promise"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  port: Number.parseInt(process.env.DB_PORT) || 3306,
  multipleStatements: true,
}

async function runMigrations() {
  let connection

  try {
    console.log("🔄 Connessione al database...")
    console.log("Database config:", { ...dbConfig, password: "***" })
    
    connection = await mysql.createConnection(dbConfig)
    console.log("Database connection created successfully")

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || "main"
    console.log(`Attempting to create/use database: ${dbName}`)
    
    try {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
      console.log("Database creation/verification successful")
    } catch (error) {
      console.error("Error creating database:", error)
      throw error
    }

    try {
      await connection.query(`USE \`${dbName}\``)
      console.log(`Connected to database: ${dbName}`)
    } catch (error) {
      console.error("Error selecting database:", error)
      throw error
    }

    // Get all SQL migration files
    const scriptsDir = path.join(__dirname)
    const sqlFiles = fs
      .readdirSync(scriptsDir)
      .filter((file) => file.endsWith(".sql") && file.match(/^\d+/))
      .sort()

    console.log(`📁 Found ${sqlFiles.length} migration files:`, sqlFiles)

    // Create migrations table if it doesn't exist
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log("Migrations table created/verified successfully")
    } catch (error) {
      console.error("Error creating migrations table:", error)
      throw error
    }

    // Check which migrations have already been run
    let executedFiles = []
    try {
      const [executedMigrations] = await connection.query("SELECT filename FROM migrations")
      executedFiles = executedMigrations.map((row) => row.filename)
      console.log("Already executed migrations:", executedFiles)
    } catch (error) {
      console.error("Error checking executed migrations:", error)
      throw error
    }

    // Run pending migrations
    for (const file of sqlFiles) {
      if (executedFiles.includes(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`)
        continue
      }

      console.log(`🔄 Executing migration: ${file}`)

      const filePath = path.join(scriptsDir, file)
      const sql = fs.readFileSync(filePath, "utf8")
      console.log(`Raw SQL content for ${file}:\n${sql}`)

      try {
        // Split SQL statements by semicolon and filter out empty statements
        const statements = sql
          .split(";")
          .map((stmt) => stmt.trim())
          .filter((stmt) => stmt.length > 0)

        console.log(`Found ${statements.length} statements in ${file}`)

        // Execute each statement separately
        for (const [index, statement] of statements.entries()) {
          console.log(`Executing statement ${index + 1}/${statements.length} from ${file}:`)
          console.log(statement)
          await connection.query(statement)
          console.log(`Statement ${index + 1} executed successfully`)
        }

        await connection.query("INSERT INTO migrations (filename) VALUES (?)", [file])
        console.log(`✅ Migration completed: ${file}`)
      } catch (error) {
        console.error(`❌ Error in migration ${file}:`, error)
        throw error
      }
    }

    console.log("🎉 All migrations completed successfully!")
  } catch (error) {
    console.error("❌ Error during migrations:", error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log("Database connection closed")
    }
  }
}

runMigrations()
