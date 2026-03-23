"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { User } from "lucide-react"
import { useState } from "react"

interface Patient {
  id: string
  first_name: string
  last_name: string
  identification_number: string | null
  date_of_birth: string
  email: string | null
  phone: string | null
  created_at: string
}

interface PatientsListProps {
  patients: Patient[]
}

export function PatientsList({ patients }: PatientsListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase()
    const search = searchTerm.toLowerCase()
    return (
      fullName.includes(search) ||
      patient.email?.toLowerCase().includes(search) ||
      patient.identification_number?.toLowerCase().includes(search)
    )
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pacientes Registrados</CardTitle>
        <CardDescription>
          {filteredPatients.length} {filteredPatients.length === 1 ? "paciente" : "pacientes"}
        </CardDescription>
        <div className="pt-2">
          <Input
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredPatients.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-8">
              {searchTerm ? "No se encontraron pacientes" : "No hay pacientes registrados"}
            </p>
          ) : (
            filteredPatients.map((patient) => (
              <div key={patient.id} className="flex items-start gap-3 rounded-lg border p-4 hover:bg-slate-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
                  <User className="h-5 w-5 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    {patient.first_name} {patient.last_name}
                  </p>
                  {patient.identification_number && (
                    <p className="text-sm text-slate-600">ID: {patient.identification_number}</p>
                  )}
                  <p className="text-sm text-slate-600">
                    {calculateAge(patient.date_of_birth)} años • Nacimiento: {formatDate(patient.date_of_birth)}
                  </p>
                  {patient.email && <p className="text-sm text-slate-600">{patient.email}</p>}
                  {patient.phone && <p className="text-sm text-slate-600">{patient.phone}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
