import mysql from "mysql2/promise"
import dotenv from "dotenv"
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

// Get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local
const envPath = join(__dirname, '..', '.env.local')
console.log('Looking for .env.local at:', envPath)

if (fs.existsSync(envPath)) {
  console.log('Found .env.local file')
  dotenv.config({ path: envPath })
} else {
  console.log('❌ .env.local file not found!')
  process.exit(1)
}

// Log all environment variables (except password)
console.log('\nEnvironment variables loaded:')
console.log('DB_HOST:', process.env.DB_HOST)
console.log('DB_USER:', process.env.DB_USER)
console.log('DB_NAME:', process.env.DB_NAME)
console.log('DB_PORT:', process.env.DB_PORT)
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***set***' : 'not set')

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number.parseInt(process.env.DB_PORT) || 3306,
  connectTimeout: 30000, // 30 seconds
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ssl: {
    rejectUnauthorized: false
  }
}

async function testConnection() {
  let connection
  try {
    console.log('\nAttempting to connect to database...')
    console.log('Connection config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port,
      connectTimeout: dbConfig.connectTimeout
    })

    // First try without database selection
    connection = await mysql.createConnection({
      ...dbConfig,
      database: undefined
    })
    console.log('✅ Successfully connected to MySQL server!')

    // Try to select the database
    await connection.query(`USE ${dbConfig.database}`)
    console.log(`✅ Successfully selected database: ${dbConfig.database}`)

    // Test a simple query
    const [rows] = await connection.query("SELECT 1 as test")
    console.log('✅ Query test successful:', rows)

  } catch (error) {
    console.error('\n❌ Database connection error:', error.message)
    if (error.code) {
      console.error('Error code:', error.code)
    }
    if (error.errno) {
      console.error('Error number:', error.errno)
    }
    if (error.sqlState) {
      console.error('SQL State:', error.sqlState)
    }
    if (error.fatal) {
      console.error('Fatal error:', error.fatal)
    }
  } finally {
    if (connection) {
      await connection.end()
      console.log('\nConnection closed')
    }
  }
}

testConnection()
