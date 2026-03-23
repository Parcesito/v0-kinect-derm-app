import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.role !== "doctor") {
      return NextResponse.json({ error: "Solo los doctores pueden crear carpetas" }, { status: 403 })
    }

    const supabase = await createClient()
    const { name, patientId, parentFolderId } = await request.json()

    if (!name || !patientId) {
      return NextResponse.json({ error: "Nombre y ID de paciente son requeridos" }, { status: 400 })
    }

    // Create folder
    const { data: folder, error: folderError } = await supabase
      .from("folders")
      .insert({
        name,
        patient_id: patientId,
        parent_folder_id: parentFolderId || null,
        created_by: session.id,
      })
      .select()
      .single()

    if (folderError) {
      if (folderError.code === "23505") {
        // Unique constraint violation
        return NextResponse.json({ error: "Ya existe una carpeta con ese nombre en esta ubicación" }, { status: 400 })
      }
      throw folderError
    }

    return NextResponse.json({
      success: true,
      folder,
    })
  } catch (error: unknown) {
    console.error("Create folder error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear carpeta" },
      { status: 500 },
    )
  }
}
