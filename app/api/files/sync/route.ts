import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { blob, metadata } = body

    if (!blob || !metadata) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    const supabase = await createClient()

    // Insert metadata into Supabase
    const { error } = await supabase.from("files").insert({
      filename: blob.pathname.split("/").pop() ?? blob.pathname,
      blob_url: blob.url,
      file_size: metadata.fileSize ?? 0,
      file_type: metadata.fileType ?? "",
      patient_id: metadata.patientId,
      folder_id: metadata.folderId ?? null,
      wound_type: metadata.woundType ?? null,
      wound_location: metadata.woundLocation ?? null,
      notes: metadata.notes ?? null,
      scan_date: metadata.scanDate ?? new Date().toISOString(),
      uploaded_by: session.id, // Use the current session ID
    })

    if (error) {
      console.error("Error saving file metadata:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Metadatos sincronizados correctamente" })
  } catch (error) {
    console.error("[v0] Error syncing metadata:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al sincronizar metadatos" },
      { status: 500 },
    )
  }
}
