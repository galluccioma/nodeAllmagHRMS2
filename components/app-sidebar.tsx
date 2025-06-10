"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, StickyNote, Users, Building2, Activity, Home, LogOut, Shield, User } from "lucide-react"
import Image from "next/image"

interface UserType {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  department_name: string
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = React.useState<UserType | null>(null)

  React.useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  const isAdmin = user?.role === "administrator"

  const userMenuItems = [
    {
      title: "Pannello di Controllo",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Documenti",
      url: "/dashboard/documents",
      icon: FileText,
    },
    {
      title: "Note",
      url: "/dashboard/notes",
      icon: StickyNote,
    },
  ]

  const adminMenuItems = [
    {
      title: "Utenti",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Dipartimenti",
      url: "/admin/departments",
      icon: Building2,
    },
    {
      title: "Tutti i Documenti",
      url: "/admin/documents",
      icon: FileText,
    },
    {
      title: "Tutte le Note",
      url: "/admin/notes",
      icon: StickyNote,
    },
    {
      title: "Log Attività",
      url: "/admin/logs",
      icon: Activity,
    },
  ]

  return (
    <Sidebar {...props}>
      <SidebarHeader className="p-4">
        <div className="flex flex-col items-center justify-center space-x-2">
          <Image src={"/allmag_logo.png"} alt="Logo" width={128} height={32}/>
          <span className="font-semibold text-lg">HRMS Software</span>
        </div>
        {user && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <Badge variant={isAdmin ? "default" : "secondary"} className="text-xs">
                {isAdmin ? (
                  <>
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </>
                ) : (
                  "User"
                )}
              </Badge>
              <span className="text-xs text-gray-500">{user.department_name}</span>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utenti</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Amministrazione</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <a href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button variant="outline" onClick={handleLogout} className="w-full">
          <LogOut className="h-4 w-4 mr-2" />
          Esci
        </Button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
