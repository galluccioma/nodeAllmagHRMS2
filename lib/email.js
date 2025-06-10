import nodemailer from "nodemailer"

let transporter = null

// Initialize transporter only if email settings are provided
function initializeTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log("Email settings not configured - email notifications disabled")
    return null
  }

  try {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  } catch (error) {
    console.error("Failed to initialize email transporter:", error)
    return null
  }
}

export async function sendNotificationEmail(to, subject, content) {
  try {
    if (!transporter) {
      transporter = initializeTransporter()
    }

    if (!transporter) {
      console.log("Email not sent - transporter not configured")
      return false
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || "noreply@company.com",
      to,
      subject,
      html: content,
    }

    await transporter.sendMail(mailOptions)
    console.log("Email sent successfully to:", to)
    return true
  } catch (error) {
    console.error("Error sending email:", error)
    return false
  }
}

export function generateDocumentNotificationEmail(documentTitle, uploaderName) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Document Available</h2>
      <p>A new document has been uploaded and is available for you to view:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="margin: 0; color: #555;">${documentTitle}</h3>
        <p style="margin: 5px 0 0 0; color: #777;">Uploaded by: ${uploaderName}</p>
      </div>
      <p>Please log in to the document management system to view this document.</p>
    </div>
  `
}

export function generateNoteNotificationEmail(noteTitle, authorName) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Note Available</h2>
      <p>A new note has been created and is available for you to view:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="margin: 0; color: #555;">${noteTitle}</h3>
        <p style="margin: 5px 0 0 0; color: #777;">Created by: ${authorName}</p>
      </div>
      <p>Please log in to the document management system to view this note.</p>
    </div>
  `
}
