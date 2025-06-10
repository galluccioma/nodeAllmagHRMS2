import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
    },
    JWT_SECRET,
    { expiresIn: "24h" },
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10)
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash)
}

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "")

  if (!token) {
    return res.status(401).json({ error: "Authentication required" })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ error: "Invalid token" })
  }

  req.user = decoded
  next()
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== "administrator") {
    return res.status(403).json({ error: "Administrator access required" })
  }
  next()
}
