import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PatientCard } from "@/components/patient-card"
import { LogoutButton } from "@/components/logout-button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { getSession } from "@/lib/session"

export default async function DoctorPatientsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/login")
  }

  // Verify they're a doctor
  if (session.role !== "doctor") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  // Get user profile with organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(name)")
    .eq("id", session.id)
    .single()

  // Get only active patients
  const { data: patients } = await supabase
    .from("patients")
    .select("*")
    .eq("is_active", true)
    .order("last_name", { ascending: true })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-cyan-600">Kinect Derm</h1>
            <p className="text-sm text-slate-600">{profile.organizations?.name || "Organización"}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{session.full_name}</p>
              <p className="text-xs text-slate-600">Doctor</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Mis Pacientes</h2>
          <p className="text-slate-600 mt-2">Selecciona un paciente para ver y gestionar sus archivos</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input placeholder="Buscar paciente por nombre..." className="pl-10" id="patient-search" />
        </div>

        {/* Patients Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients && patients.length > 0 ? (
            patients.map((patient) => <PatientCard key={patient.id} patient={patient} />)
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-500">No hay pacientes registrados en el sistema</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
