"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Building2, Plus, Edit, Trash2, Users, FileText } from "lucide-react"

interface Department {
  id: number
  name: string
  user_count: number
  created_at: string
}

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [departmentName, setDepartmentName] = useState("")

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch("/api/admin/departments", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      }
    } catch (error) {
      console.error("Error fetching departments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const token = localStorage.getItem("token")
    try {
      const response = await fetch("/api/admin/departments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: departmentName }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Department created successfully")
        setShowCreateModal(false)
        setDepartmentName("")
        fetchDepartments()
      } else {
        setError(data.error || "Failed to create department")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const handleEditDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDepartment) return

    setError("")
    setSuccess("")

    const token = localStorage.getItem("token")
    try {
      const response = await fetch(`/api/admin/departments/${editingDepartment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: departmentName }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Department updated successfully")
        setShowEditModal(false)
        setEditingDepartment(null)
        setDepartmentName("")
        fetchDepartments()
      } else {
        setError(data.error || "Failed to update department")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const handleDeleteDepartment = async (departmentId: number) => {
    if (!confirm("Are you sure you want to delete this department?")) return

    const token = localStorage.getItem("token")
    try {
      const response = await fetch(`/api/admin/departments/${departmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Department deleted successfully")
        fetchDepartments()
      } else {
        setError(data.error || "Failed to delete department")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const openEditModal = (department: Department) => {
    setEditingDepartment(department)
    setDepartmentName(department.name)
    setShowEditModal(true)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Dipartimenti</h1>
          </div>
          <div className="ml-auto">
            <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Organizza Dipartimenti
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 max-w-7xl mx-auto space-y-6">
          {departments.map((department) => (
            <Card key={department.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{department.name}</h3>
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {department.user_count} users
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(department.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(department)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteDepartment(department.id)}
                      disabled={department.user_count > 0}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Department Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
              <DialogDescription>Add a new department to the organization</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <Label htmlFor="department_name">Department Name</Label>
                <Input
                  id="department_name"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="Enter department name"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Department</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Department Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
              <DialogDescription>Update department information</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditDepartment} className="space-y-4">
              <div>
                <Label htmlFor="edit_department_name">Department Name</Label>
                <Input
                  id="edit_department_name"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="Enter department name"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Department</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
