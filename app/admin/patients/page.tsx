import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CreatePatientForm } from "@/components/create-patient-form"
import { PatientsListEnhanced } from "@/components/patients-list-enhanced"
import { LogoutButton } from "@/components/logout-button"
import { getSession } from "@/lib/session"

export default async function PatientsManagementPage() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/login")
  }

  // Verify they're a patient admin
  if (session.role !== "patient_admin") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  // Get user profile with organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(name)")
    .eq("id", session.id)
    .single()

  // Get all patients
  const { data: patients } = await supabase.from("patients").select("*").order("created_at", { ascending: false })

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
              <p className="text-sm font-medium">{profile.full_name}</p>
              <p className="text-xs text-slate-600">Administrador de Pacientes</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Gestión de Pacientes</h2>
          <p className="text-slate-600 mt-2">Registra y administra pacientes en el sistema</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Create Patient Form */}
          <div className="lg:col-span-1">
            <CreatePatientForm />
          </div>

          {/* Patients List */}
          <div className="lg:col-span-2">
            <PatientsListEnhanced patients={patients || []} />
          </div>
        </div>
      </main>
    </div>
  )
}
