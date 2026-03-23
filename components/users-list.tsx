"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface User {
  id: string
  username: string
  email: string
  full_name: string
  role: string
  created_at: string
}

interface UsersListProps {
  users: User[]
}

const roleLabels: Record<string, string> = {
  doctor: "Doctor",
  patient_admin: "Admin. Pacientes",
  org_admin: "Admin. Organización",
}

const roleColors: Record<string, string> = {
  doctor: "bg-blue-100 text-blue-800",
  patient_admin: "bg-purple-100 text-purple-800",
  org_admin: "bg-cyan-100 text-cyan-800",
}

export function UsersList({ users: initialUsers }: UsersListProps) {
  const [users, setUsers] = useState(initialUsers)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const handleRefresh = async () => {
      try {
        const response = await fetch('/api/admin/users/list')
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
        }
      } catch (error) {
        console.error('[v0] Error refreshing users:', error)
      }
    }
    window.addEventListener('refreshUsers', handleRefresh)
    return () => window.removeEventListener('refreshUsers', handleRefresh)
  }, [])

  // Edit form state
  const [editUsername, setEditUsername] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editFullName, setEditFullName] = useState("")
  const [editRole, setEditRole] = useState("")
  const [editPassword, setEditPassword] = useState("")

  const handleEditClick = (user: User) => {
    setEditingUser(user)
    setEditUsername(user.username)
    setEditEmail(user.email || "")
    setEditFullName(user.full_name)
    setEditRole(user.role)
    setEditPassword("")
  }

  const handleEditSubmit = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/edit-user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser?.id,
          username: editUsername,
          email: editEmail,
          fullName: editFullName,
          role: editRole,
          password: editPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al editar usuario")
      }

      toast({
        title: "Usuario actualizado",
        description: `${editFullName} ha sido actualizado exitosamente`,
      })

      setUsers(prev => prev.map(u => u.id === editingUser?.id ? { ...u, username: editUsername, email: editEmail, full_name: editFullName, role: editRole } : u))
      setEditingUser(null)
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al editar usuario",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingUserId) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deletingUserId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar usuario")
      }

      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido desactivado exitosamente",
      })

      setUsers(prev => prev.filter(u => u.id !== deletingUserId))
      setDeletingUserId(null)
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar usuario",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Usuarios de la Organización</CardTitle>
          <CardDescription>
            {users.length} {users.length === 1 ? "usuario" : "usuarios"} registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-8">No hay usuarios registrados</p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{user.full_name}</p>
                    <p className="text-sm text-slate-600">@{user.username}</p>
                    {user.email && <p className="text-sm text-slate-500">{user.email}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={roleColors[user.role] || "bg-gray-100 text-gray-800"}>
                      {roleLabels[user.role] || user.role}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(user)}
                      className="bg-transparent"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingUserId(user.id)}
                      className="bg-transparent text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifica la información del usuario</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Nombre Completo</Label>
              <Input
                id="edit-fullName"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">Usuario</Label>
              <Input
                id="edit-username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Correo Electrónico</Label>
              <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nueva Contraseña (dejar vacío para no cambiar)</Label>
              <Input
                id="edit-password"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rol</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="patient_admin">Administrador de Pacientes</SelectItem>
                  <SelectItem value="org_admin">Administrador de Organización</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleEditSubmit} disabled={isLoading} className="bg-cyan-600 hover:bg-cyan-700">
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingUserId} onOpenChange={() => setDeletingUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este usuario? Esta acción desactivará el usuario en el sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingUserId(null)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? "Eliminando..." : "Eliminar Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
