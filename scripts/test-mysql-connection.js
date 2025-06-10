import mysql from "mysql2/promise"
import dotenv from "dotenv"
import { readFileSync, existsSync } from "fs"

// Load environment variables
dotenv.config({ path: ".env.local" })

async function testConnection(config, description) {
  console.log(`\n🔍 Testing ${description}...`)
  console.log(`   Host: ${config.host}`)
  console.log(`   User: ${config.user}`)
  console.log(`   Password: ${config.password ? "***set***" : "not set"}`)

  try {
    const connection = await mysql.createConnection(config)
    console.log(`✅ ${description} - Connection successful!`)
    await connection.end()
    return true
  } catch (error) {
    console.log(`❌ ${description} - Failed: ${error.message}`)
    return false
  }
}

async function findWorkingConnection() {
  console.log("🔍 Searching for working MySQL connection...\n")

  // Check if .env.local exists
  if (!existsSync(".env.local")) {
    console.log("❌ .env.local file not found!")
    console.log("📝 Please create .env.local file with your database credentials")
    return
  }

  // Show current .env.local content (without sensitive data)
  try {
    const envContent = readFileSync(".env.local", "utf8")
    console.log("📄 Current .env.local file contains:")
    envContent.split("\n").forEach((line) => {
      if (line.startsWith("DB_")) {
        if (line.includes("PASSWORD")) {
          const [key] = line.split("=")
          console.log(`   ${key}=***hidden***`)
        } else {
          console.log(`   ${line}`)
        }
      }
    })
  } catch (error) {
    console.log("❌ Could not read .env.local file")
  }

  const baseConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
  }

  // Test scenarios
  const scenarios = [
    {
      ...baseConfig,
      password: process.env.DB_PASSWORD || "",
      description: "Environment variables from .env.local",
    },
    {
      ...baseConfig,
      password: "",
      description: "Empty password",
    },
    {
      ...baseConfig,
      password: "root",
      description: "Password: root",
    },
    {
      ...baseConfig,
      password: "password",
      description: "Password: password",
    },
    {
      ...baseConfig,
      password: "admin",
      description: "Password: admin",
    },
  ]

  for (const scenario of scenarios) {
    const success = await testConnection(scenario, scenario.description)
    if (success) {
      console.log("\n🎉 Found working connection!")
      console.log("📝 Update your .env.local file with these settings:")
      console.log(`DB_HOST=${scenario.host}`)
      console.log(`DB_USER=${scenario.user}`)
      console.log(`DB_PASSWORD=${scenario.password}`)
      return
    }
  }

  console.log("\n❌ No working connection found.")
  console.log("\n💡 Suggestions:")
  console.log("1. Make sure MySQL is running: brew services start mysql")
  console.log("2. Try connecting manually: mysql -u root -p")
  console.log("3. Reset MySQL root password if needed")
  console.log("4. Check if you're using XAMPP/MAMP with different defaults")
}

findWorkingConnection()
