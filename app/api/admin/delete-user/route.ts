import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.role !== "org_admin") {
      return NextResponse.json({ error: "No tienes permisos para eliminar usuarios" }, { status: 403 })
    }

    const { userId } = await request.json()

    // Prevent deleting yourself
    if (userId === session.id) {
      return NextResponse.json({ error: "No puedes eliminar tu propio usuario" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify the user belongs to the org admin's organization
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", userId)
      .single()

    if (!existingUser || existingUser.organization_id !== session.organization_id) {
      return NextResponse.json({ error: "No puedes eliminar usuarios de otra organización" }, { status: 403 })
    }

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase.from("profiles").update({ is_active: false }).eq("id", userId)

    if (deleteError) {
      throw new Error("Error al eliminar el usuario")
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("[v0] Delete user error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al eliminar usuario" },
      { status: 500 },
    )
  }
}
