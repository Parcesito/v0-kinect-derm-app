import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.role !== "org_admin") {
      return NextResponse.json({ error: "No tienes permisos para editar usuarios" }, { status: 403 })
    }

    const { userId, username, email, fullName, role, password } = await request.json()

    const supabase = await createClient()

    // Verify the user belongs to the org admin's organization
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single()

    if (!existingUser || existingUser.organization_id !== session.organization_id) {
      return NextResponse.json({ error: "No puedes editar usuarios de otra organización" }, { status: 403 })
    }

    // Build update object
    const updateData: any = {
      username,
      email: email || null,
      full_name: fullName,
      role,
    }

    // Only update password if provided
    if (password && password.length > 0) {
      updateData.password_hash = password
    }

    // Update user profile
    const { error: updateError } = await supabase.from("profiles").update(updateData).eq("id", userId)

    if (updateError) {
      throw new Error("Error al actualizar el usuario")
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("[v0] Edit user error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al editar usuario" },
      { status: 500 },
    )
  }
}
