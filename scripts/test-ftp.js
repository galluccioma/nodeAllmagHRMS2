import { config } from 'dotenv'
import { testFtpConnection, saveFile } from '../lib/file-storage.js'
import fs from 'fs'
import path from 'path'

// Load environment variables
config()

async function runTest() {
  console.log('=== Starting FTP Connection Test ===')
  console.log('Environment variables loaded:', {
    FTP_HOST: process.env.FTP_HOST,
    FTP_USER: process.env.FTP_USER,
    FTP_SECURE: process.env.FTP_SECURE,
    FTP_UPLOADS_PATH: process.env.FTP_UPLOADS_PATH,
    FTP_PUBLIC_URL: process.env.FTP_PUBLIC_URL
  })
  
  // Test 1: FTP Connection
  console.log('\nTest 1: Testing FTP Connection')
  const connectionTest = await testFtpConnection()
  if (!connectionTest) {
    console.error('❌ FTP connection test failed')
    process.exit(1)
  }
  console.log('✅ FTP connection test passed')
  
  // Test 2: File Upload
  console.log('\nTest 2: Testing File Upload')
  try {
    // Create a test file
    const testDir = path.join(process.cwd(), 'test-files')
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }
    
    const testFilePath = path.join(testDir, 'test.txt')
    fs.writeFileSync(testFilePath, 'This is a test file for FTP upload')
    
    // Create a File object from the test file
    const file = new File(
      [fs.readFileSync(testFilePath)],
      'test.txt',
      { type: 'text/plain' }
    )
    
    // Test file upload
    const result = await saveFile(file, 'test')
    console.log('Upload result:', result)
    
    // Clean up test file
    fs.unlinkSync(testFilePath)
    console.log('✅ File upload test passed')
  } catch (error) {
    console.error('❌ File upload test failed:', error)
    process.exit(1)
  }
  
  console.log('\n=== All tests completed successfully ===')
}

runTest().catch(error => {
  console.error('Test failed:', error)
  process.exit(1)
}) 