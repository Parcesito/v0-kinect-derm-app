import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, getProfile } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { FileManagerClient } from "@/components/file-manager-client"

export default async function FolderPage({
  params,
}: {
  params: Promise<{ patientId: string; folderId: string }>
}) {
  const { patientId, folderId } = await params
  const session = await requireAuth()
  const profile = await getProfile()

  if (!profile || profile.role !== "doctor") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  // Get folder info
  const { data: folder } = await supabase.from("folders").select("*").eq("id", folderId).single()

  if (!folder || folder.patient_id !== patientId) {
    redirect(`/doctor/patients/${patientId}`)
  }

  // Get patient info
  const { data: patient } = await supabase.from("patients").select("*").eq("id", patientId).single()

  // Get subfolders
  const { data: folders } = await supabase
    .from("folders")
    .select("*")
    .eq("parent_folder_id", folderId)
    .order("name", { ascending: true })

  // Get files in this folder
  const { data: files } = await supabase
    .from("files")
    .select("*")
    .eq("folder_id", folderId)
    .order("created_at", { ascending: false })

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
        <Link href={`/doctor/patients/${patientId}`}>
          <Button variant="ghost" className="mb-4 gap-2">
            <ChevronLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>

        {/* Breadcrumb */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Link href={`/doctor/patients/${patientId}`} className="hover:text-cyan-600">
              {patient?.first_name} {patient?.last_name}
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-900">{folder.name}</span>
          </div>
        </div>

        {/* File Manager */}
        <FileManagerClient 
          patientId={patientId} 
          initialFolders={folders || []} 
          initialFiles={files || []} 
          currentFolderId={folderId}
        />
      </main>
    </div>
  )
}
