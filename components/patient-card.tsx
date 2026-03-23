"use client"

import { Card, CardContent } from "@/components/ui/card"
import { User, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Patient {
  id: string
  first_name: string
  last_name: string
  identification_number: string | null
  date_of_birth: string
  email: string | null
}

interface PatientCardProps {
  patient: Patient
}

export function PatientCard({ patient }: PatientCardProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const searchInput = document.getElementById("patient-search") as HTMLInputElement
    if (!searchInput) return

    const handleSearch = () => {
      const searchTerm = searchInput.value.toLowerCase()
      const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase()
      setIsVisible(fullName.includes(searchTerm))
    }

    searchInput.addEventListener("input", handleSearch)
    return () => searchInput.removeEventListener("input", handleSearch)
  }, [patient])

  if (!isVisible) return null

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
    <Link href={`/doctor/patients/${patient.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardContent className="p-6 flex items-center h-full min-h-[140px]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 shrink-0">
              <User className="h-6 w-6 text-cyan-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">
                {patient.first_name} {patient.last_name}
              </h3>
              {patient.identification_number && (
                <p className="text-sm text-slate-500">ID: {patient.identification_number}</p>
              )}
              <p className="text-sm text-slate-600">{calculateAge(patient.date_of_birth)} años</p>
              {patient.email && <p className="text-sm text-slate-500 truncate">{patient.email}</p>}
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
