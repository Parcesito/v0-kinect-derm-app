import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Only patient_admin can list patients
    if (session.role !== "patient_admin") {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 })
    }

    const supabase = await createClient()

    // Get all patients
    const { data: patients, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ patients })
  } catch (error) {
    console.error("[v0] Error listing patients:", error)
    return NextResponse.json({ error: "Error al listar pacientes" }, { status: 500 })
  }
}
