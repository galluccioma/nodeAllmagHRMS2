"use client"

import { useState } from "react"

interface Department {
  id: number
  name: string
}

interface UserDepartmentModalProps {
  userId: number
  userName: string
  currentDepartmentId?: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function UserDepartmentModal({
  userId,
  userName,
  currentDepartmentId,
  isOpen,
  onClose,
  onSuccess,
}: UserDepartmentModalProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("")
  const [loading, setLoading] = useState(false)
