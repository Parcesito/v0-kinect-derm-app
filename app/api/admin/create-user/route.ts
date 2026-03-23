import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.role !== "org_admin") {
      return NextResponse.json({ error: "No tienes permisos para crear usuarios" }, { status: 403 })
    }

    const { username, email, password, fullName, role, organizationId } = await request.json()

    // Verify the org admin is creating a user for their own organization
    if (organizationId !== session.organization_id) {
      return NextResponse.json({ error: "No puedes crear usuarios en otra organización" }, { status: 403 })
    }

    const supabase = await createClient()

    // Create profile directly in database with simple auth
    const { data: newUser, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: randomBytes(16).toString("hex"), // Generate random ID
        username,
        password_hash: password, // In production, hash this properly
        full_name: fullName,
        role,
        organization_id: organizationId,
        email: email || null,
        is_active: true,
      })
      .select()
      .single()

    if (profileError) {
      throw new Error("Error al crear el perfil del usuario")
    }

    return NextResponse.json({
      success: true,
      userId: newUser.id,
    })
  } catch (error: unknown) {
    console.error("[v0] Create user error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear usuario" },
      { status: 500 },
    )
  }
}
