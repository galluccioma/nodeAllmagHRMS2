import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"

// Configurazione per cPanel
const getUploadsPath = () => {
  // Per cPanel, usa il percorso assoluto alla cartella pubblica
  if (process.env.CPANEL_UPLOADS_PATH) {
    return process.env.CPANEL_UPLOADS_PATH
  }

  // Per sviluppo locale
  return path.join(process.cwd(), "uploads")
}

// Configurazione per URL pubblico
const getPublicUrl = (filename) => {
  if (process.env.CPANEL_UPLOADS_URL) {
    return `${process.env.CPANEL_UPLOADS_URL}/${filename}`
  }

  // Per sviluppo locale
  return `/uploads/${filename}`
}

export const saveFile = async (file, subfolder = "") => {
  try {
    const uploadsDir = path.join(getUploadsPath(), subfolder)

    // Crea la directory se non esiste
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    // Genera nome file unico
    const fileExtension = path.extname(file.name)
    const fileName = `${uuidv4()}${fileExtension}`
    const filePath = path.join(uploadsDir, fileName)

    // Salva il file
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(filePath, fileBuffer)

    return {
      fileName,
      filePath,
      publicUrl: getPublicUrl(path.join(subfolder, fileName).replace(/\\/g, "/")),
    }
  } catch (error) {
    console.error("Errore nel salvataggio del file:", error)
    throw new Error("Impossibile salvare il file")
  }
}

export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      return true
    }
    return false
  } catch (error) {
    console.error("Errore nell'eliminazione del file:", error)
    return false
  }
}

export const getFileStream = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error("File non trovato")
  }
  return fs.createReadStream(filePath)
}
