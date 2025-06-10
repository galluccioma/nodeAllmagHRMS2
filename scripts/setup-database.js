import fs from "fs"
import path from "path"
import mysql from "mysql2/promise"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "node2",
  port: Number.parseInt(process.env.DB_PORT) || 3306,
  multipleStatements: true // Allow multiple SQL statements
}

async function setupDatabase() {
  let connection

  try {
    // First connect without database to create it if needed
    connection = await mysql.createConnection(dbConfig)

    console.log("Connected to MySQL server")

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || "node2"}`)
    console.log(`Database ${process.env.DB_NAME || "node2"} created or already exists`)

    // Use the database
    await connection.query(`USE ${process.env.DB_NAME || "node2"}`)

    // Read and execute the schema creation script
    const schemaScript = fs.readFileSync(path.join(process.cwd(), "scripts", "01-create-database.sql"), "utf8")
    console.log("Executing schema creation script...")
    await connection.query(schemaScript)
    console.log("Schema created successfully")

    // Read and execute the seed data script
    const seedScript = fs.readFileSync(path.join(process.cwd(), "scripts", "02-seed-data.sql"), "utf8")
    console.log("Executing seed data script...")
    await connection.query(seedScript)
    console.log("Seed data inserted successfully")

    console.log("Database setup completed successfully!")
  } catch (error) {
    console.error("Error setting up database:", error)
  } finally {
    if (connection) {
      await connection.end()
      console.log("Database connection closed")
    }
  }
}

setupDatabase()
