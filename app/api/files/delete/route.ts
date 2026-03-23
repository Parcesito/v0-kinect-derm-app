import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { del } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.role !== "doctor") {
      return NextResponse.json({ error: "Solo los doctores pueden eliminar archivos" }, { status: 403 })
    }

    const supabase = await createClient()
    const { fileId } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: "No se proporcionó ID de archivo" }, { status: 400 })
    }

    // Get file record to obtain blob URL
    const { data: file } = await supabase.from("files").select("blob_url").eq("id", fileId).single()

    if (!file) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
    }

    // Delete from Vercel Blob
    await del(file.blob_url)

    // Delete from database
    const { error: deleteError } = await supabase.from("files").delete().eq("id", fileId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Delete error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al eliminar archivo" },
      { status: 500 },
    )
  }
}
