import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, getProfile } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { FileManagerClient } from "@/components/file-manager-client"

export default async function PatientFilesPage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const { patientId } = await params
  const session = await requireAuth()
  const profile = await getProfile()
  
  if (!profile || profile.role !== "doctor") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  // Get patient info
  const { data: patient } = await supabase.from("patients").select("*").eq("id", patientId).single()

  if (!patient) {
    redirect("/doctor/patients")
  }

  // Get folders for this patient
  const { data: folders } = await supabase
    .from("folders")
    .select("*")
    .eq("patient_id", patientId)
    .is("parent_folder_id", null)
    .order("name", { ascending: true })

  // Get files for this patient (root level - no folder)
  const { data: files } = await supabase
    .from("files")
    .select("*")
    .eq("patient_id", patientId)
    .is("folder_id", null)
    .order("created_at", { ascending: false })

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
              <p className="text-xs text-slate-600">Doctor</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Back Button */}
        <Link href="/doctor/patients">
          <Button variant="ghost" className="mb-4 gap-2">
            <ChevronLeft className="h-4 w-4" />
            Volver a Pacientes
          </Button>
        </Link>

        {/* Patient Info */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm border">
          <h2 className="text-2xl font-bold text-slate-900">
            {patient.first_name} {patient.last_name}
          </h2>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
            {patient.identification_number && <span>ID: {patient.identification_number}</span>}
            <span>{calculateAge(patient.date_of_birth)} años</span>
            {patient.email && <span>{patient.email}</span>}
            {patient.phone && <span>{patient.phone}</span>}
          </div>
          {patient.address && <p className="mt-2 text-sm text-slate-600">{patient.address}</p>}
        </div>

        {/* File Manager */}
        <FileManagerClient 
          patientId={patientId}
          patient={patient}
          initialFolders={folders || []} 
          initialFiles={files || []} 
        />
      </main>
    </div>
  )
}
