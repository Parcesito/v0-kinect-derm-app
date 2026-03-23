import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Only org_admin can list users
    if (session.role !== "org_admin") {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 })
    }

    const supabase = await createClient()

    // Get users from the same organization
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, username, email, full_name, role, created_at")
      .eq("organization_id", session.organization_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error("[v0] Error listing users:", error)
    return NextResponse.json({ error: "Error al listar usuarios" }, { status: 500 })
  }
}
