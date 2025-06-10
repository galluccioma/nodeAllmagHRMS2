import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { Client } from "basic-ftp"

// Test FTP connection
export const testFtpConnection = async () => {
  const ftpConfig = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    secure: process.env.FTP_SECURE === "true"
  }
  const client = new Client()
  try {
    console.log('Testing FTP connection...')
    console.log('FTP Config:', {
      host: ftpConfig.host,
      user: ftpConfig.user,
      secure: ftpConfig.secure
    })
    
    await client.access(ftpConfig)
    console.log('✅ FTP connection successful')
    
    // Test directory listing
    const remotePath = getRemoteUploadsPath()
    console.log('Testing directory access:', remotePath)
    const list = await client.list(remotePath)
    console.log('✅ Directory listing successful:', list)
    
    return true
  } catch (error) {
    console.error('❌ FTP connection test failed:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    return false
  } finally {
    client.close()
  }
}

// Get the remote uploads path
const getRemoteUploadsPath = () => {
  return process.env.FTP_UPLOADS_PATH || "/public_html/uploads"
}

// Get the public URL for files
const getPublicUrl = (filename) => {
  if (process.env.FTP_PUBLIC_URL) {
    return `${process.env.FTP_PUBLIC_URL}/${filename}`
  }
  return `/uploads/${filename}`
}

// Upload file to FTP server
const uploadToFtp = async (localPath, remotePath) => {
  const ftpConfig = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    secure: process.env.FTP_SECURE === "true"
  }
  const client = new Client()
  try {
    console.log('Starting FTP upload process...')
    console.log('Local file:', localPath)
    console.log('Remote path:', remotePath)
    
    console.log('Connecting to FTP server...')
    await client.access(ftpConfig)
    console.log('✅ FTP connection established')
    
    // Ensure remote directory exists
    const remoteDir = path.dirname(remotePath)
    console.log('Creating/verifying remote directory:', remoteDir)
    await client.ensureDir(remoteDir)
    console.log('✅ Remote directory verified')
    
    // Check if file exists locally
    if (!fs.existsSync(localPath)) {
      throw new Error(`Local file not found: ${localPath}`)
    }
    console.log('✅ Local file verified')
    
    // Get file size
    const stats = fs.statSync(localPath)
    console.log('File size:', stats.size, 'bytes')
    
    console.log('Starting file upload...')
    await client.uploadFrom(localPath, remotePath)
    console.log('✅ File upload completed successfully')
    
    // Verify file was uploaded
    const list = await client.list(remoteDir)
    const uploadedFile = list.find(f => f.name === path.basename(remotePath))
    if (!uploadedFile) {
      throw new Error('File upload verification failed')
    }
    console.log('✅ File upload verified:', uploadedFile)
    
    return true
  } catch (error) {
    console.error('❌ FTP upload failed:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    throw new Error(`Failed to upload file to FTP server: ${error.message}`)
  } finally {
    client.close()
  }
}

// Delete file from FTP server
const deleteFromFtp = async (remotePath) => {
  const ftpConfig = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    secure: process.env.FTP_SECURE === "true"
  }
  const client = new Client()
  try {
    console.log('Starting FTP delete process...')
    console.log('Remote file:', remotePath)
    
    await client.access(ftpConfig)
    console.log('✅ FTP connection established')
    
    await client.remove(remotePath)
    console.log('✅ File deleted successfully')
    
    return true
  } catch (error) {
    console.error('❌ FTP delete failed:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    throw new Error(`Failed to delete file from FTP server: ${error.message}`)
  } finally {
    client.close()
  }
}

export const saveFile = async (file, subfolder = "") => {
  try {
    console.log('Starting file save process...')
    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    })
    
    // Create a temporary local file
    const tempDir = path.join(process.cwd(), "temp")
    if (!fs.existsSync(tempDir)) {
      console.log('Creating temp directory:', tempDir)
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name)
    const fileName = `${uuidv4()}${fileExtension}`
    const tempFilePath = path.join(tempDir, fileName)
    
    console.log('Saving file temporarily:', tempFilePath)
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(tempFilePath, fileBuffer)
    console.log('✅ Temporary file saved')

    // Prepare remote path
    const remoteSubfolder = path.join(getRemoteUploadsPath(), subfolder).replace(/\\/g, "/")
    const remotePath = `${remoteSubfolder}/${fileName}`
    console.log('Remote path prepared:', remotePath)

    // Upload to FTP
    await uploadToFtp(tempFilePath, remotePath)
    console.log('✅ FTP upload completed')

    // Clean up temporary file
    console.log('Cleaning up temporary file...')
    fs.unlinkSync(tempFilePath)
    console.log('✅ Temporary file removed')

    return {
      fileName,
      filePath: remotePath,
      publicUrl: getPublicUrl(path.join(subfolder, fileName).replace(/\\/g, "/")),
    }
  } catch (error) {
    console.error('❌ File save process failed:', {
      message: error.message,
      stack: error.stack
    })
    throw new Error(`Failed to save file: ${error.message}`)
  }
}

export const deleteFile = async (filePath) => {
  try {
    console.log('Starting file deletion process...')
    console.log('File path:', filePath)
    
    await deleteFromFtp(filePath)
    console.log('✅ File deletion completed')
    
    return true
  } catch (error) {
    console.error('❌ File deletion failed:', {
      message: error.message,
      stack: error.stack
    })
    return false
  }
}

// Note: getFileStream is not implemented for FTP as files should be accessed via public URL
export const getFileStream = (filePath) => {
  throw new Error("Direct file streaming is not supported with FTP storage. Use public URL instead.")
}
