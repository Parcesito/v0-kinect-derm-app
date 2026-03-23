import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.role !== "patient_admin") {
      return NextResponse.json({ error: "No tienes permisos para modificar pacientes" }, { status: 403 })
    }

    const { patientId, isActive } = await request.json()

    const supabase = await createClient()

    // Toggle patient active status
    const { error: updateError } = await supabase.from("patients").update({ is_active: isActive }).eq("id", patientId)

    if (updateError) {
      throw new Error("Error al actualizar el estado del paciente")
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("[v0] Toggle patient status error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al actualizar estado del paciente" },
      { status: 500 },
    )
  }
}
