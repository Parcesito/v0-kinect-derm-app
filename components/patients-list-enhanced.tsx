"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Power, PowerOff, Search } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"

interface Patient {
  id: string
  first_name: string
  last_name: string
  identification_number: string | null
  date_of_birth: string
  email: string | null
  phone: string | null
  address: string | null
  is_active: boolean
  created_at: string
}

interface PatientsListEnhancedProps {
  patients: Patient[]
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function PatientsListEnhanced({ patients: initialPatients }: PatientsListEnhancedProps) {
  const [patients, setPatients] = useState(initialPatients)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Edit form state
  const [editFirstName, setEditFirstName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [editIdentificationNumber, setEditIdentificationNumber] = useState("")
  const [editDateOfBirth, setEditDateOfBirth] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editAddress, setEditAddress] = useState("")

  useEffect(() => {
    const handleRefresh = async () => {
      try {
        const response = await fetch('/api/patients/list')
        if (response.ok) {
          const data = await response.json()
          setPatients(data.patients || [])
        }
      } catch (error) {
        console.error('[v0] Error refreshing patients:', error)
      }
    }
    window.addEventListener('refreshPatients', handleRefresh)
    return () => window.removeEventListener('refreshPatients', handleRefresh)
  }, [])

  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase()
    const search = searchTerm.toLowerCase()
    return (
      fullName.includes(search) ||
      patient.email?.toLowerCase().includes(search) ||
      patient.identification_number?.toLowerCase().includes(search)
    )
  })

  const handleEditClick = (patient: Patient) => {
    setEditingPatient(patient)
    setEditFirstName(patient.first_name)
    setEditLastName(patient.last_name)
    setEditIdentificationNumber(patient.identification_number || "")
    setEditDateOfBirth(patient.date_of_birth)
    setEditEmail(patient.email || "")
    setEditPhone(patient.phone || "")
    setEditAddress(patient.address || "")
  }

  const handleEditSubmit = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/patients/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: editingPatient?.id,
          firstName: editFirstName,
          lastName: editLastName,
          identificationNumber: editIdentificationNumber,
          dateOfBirth: editDateOfBirth,
          email: editEmail,
          phone: editPhone,
          address: editAddress,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al editar paciente")
      }

      toast({
        title: "Paciente actualizado",
        description: `${editFirstName} ${editLastName} ha sido actualizado exitosamente`,
      })

      // Update local state
      setPatients((prev) =>
        prev.map((p) =>
          p.id === editingPatient?.id
            ? {
                ...p,
                first_name: editFirstName,
                last_name: editLastName,
                identification_number: editIdentificationNumber,
                date_of_birth: editDateOfBirth,
                email: editEmail,
                phone: editPhone,
                address: editAddress,
              }
            : p,
        ),
      )

      setEditingPatient(null)
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al editar paciente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (patientId: string, currentStatus: boolean) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/patients/toggle-active", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          isActive: !currentStatus,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cambiar estado")
      }

      toast({
        title: currentStatus ? "Paciente inactivado" : "Paciente activado",
        description: `El paciente ahora está ${!currentStatus ? "activo" : "inactivo"}`,
      })

      // Update local state
      setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, is_active: !currentStatus } : p)))
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cambiar estado",
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
          <CardTitle>Pacientes Registrados</CardTitle>
          <CardDescription>
            {filteredPatients.length} {filteredPatients.length === 1 ? "paciente" : "pacientes"}
          </CardDescription>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar paciente por nombre, ID o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredPatients.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-8">No hay pacientes registrados</p>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">
                        {patient.first_name} {patient.last_name}
                      </p>
                      {!patient.is_active && (
                        <Badge variant="outline" className="bg-slate-100 text-slate-600">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    {patient.identification_number && (
                      <p className="text-sm text-slate-600">ID: {patient.identification_number}</p>
                    )}
                    <p className="text-sm text-slate-600">
                      {calculateAge(patient.date_of_birth)} años • Nacimiento: {formatDate(patient.date_of_birth)}
                    </p>
                    {patient.email && <p className="text-sm text-slate-600">{patient.email}</p>}
                    {patient.phone && <p className="text-sm text-slate-600">{patient.phone}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(patient)}
                      disabled={isLoading}
                      className="bg-transparent"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(patient.id, patient.is_active)}
                      disabled={isLoading}
                      className={`bg-transparent ${patient.is_active ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}`}
                    >
                      {patient.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingPatient} onOpenChange={() => setEditingPatient(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>Modifica la información del paciente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">Nombres</Label>
              <Input
                id="edit-firstName"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Apellidos</Label>
              <Input
                id="edit-lastName"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-identificationNumber">Número de Identificación</Label>
              <Input
                id="edit-identificationNumber"
                value={editIdentificationNumber}
                onChange={(e) => setEditIdentificationNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dateOfBirth">Fecha de Nacimiento</Label>
              <Input
                id="edit-dateOfBirth"
                type="date"
                value={editDateOfBirth}
                onChange={(e) => setEditDateOfBirth(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Correo Electrónico</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input id="edit-phone" type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Dirección</Label>
              <Textarea
                id="edit-address"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPatient(null)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleEditSubmit} disabled={isLoading} className="bg-cyan-600 hover:bg-cyan-700">
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
