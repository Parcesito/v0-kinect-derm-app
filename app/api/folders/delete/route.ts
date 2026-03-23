import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.role !== "doctor") {
      return NextResponse.json({ error: "Solo los doctores pueden eliminar carpetas" }, { status: 403 })
    }

    const supabase = await createClient()
    const { folderId } = await request.json()

    if (!folderId) {
      return NextResponse.json({ error: "No se proporcionó ID de carpeta" }, { status: 400 })
    }

    // Delete folder (cascade will delete files in folder)
    const { error: deleteError } = await supabase.from("folders").delete().eq("id", folderId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Delete folder error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al eliminar carpeta" },
      { status: 500 },
    )
  }
}
