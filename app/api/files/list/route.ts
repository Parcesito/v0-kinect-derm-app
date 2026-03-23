import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Only doctors can list files
    if (session.role !== "doctor") {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const patientId = searchParams.get("patientId")
    const folderId = searchParams.get("folderId")

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID requerido" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get folders - handle null parent_folder_id correctly
    let foldersQuery = supabase
      .from("folders")
      .select("*")
      .eq("patient_id", patientId)

    if (folderId) {
      foldersQuery = foldersQuery.eq("parent_folder_id", folderId)
    } else {
      foldersQuery = foldersQuery.is("parent_folder_id", null)
    }

    const { data: folders } = await foldersQuery.order("name", { ascending: true })

    // Get files - handle null folder_id correctly
    let filesQuery = supabase
      .from("files")
      .select("*")
      .eq("patient_id", patientId)

    if (folderId) {
      filesQuery = filesQuery.eq("folder_id", folderId)
    } else {
      filesQuery = filesQuery.is("folder_id", null)
    }

    const { data: files } = await filesQuery.order("created_at", { ascending: false })

    return NextResponse.json({ folders: folders || [], files: files || [] })
  } catch (error) {
    console.error("[v0] Error listing files:", error)
    return NextResponse.json({ error: "Error al listar archivos" }, { status: 500 })
  }
}
