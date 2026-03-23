import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { setSession } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Usuario y contraseña son requeridos" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get user by username - use maybeSingle to avoid 406 error when user doesn't exist
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, role, organization_id, email, password_hash, is_active")
      .eq("username", username)
      .eq("is_active", true)
      .maybeSingle()

    if (error || !profile) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 })
    }

    // Simple password comparison (stored as plain text for now)
    // In production, you would use bcrypt.compare(password, profile.password_hash)
    if (password !== profile.password_hash) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 })
    }

    // Create session
    await setSession({
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name,
      role: profile.role,
      organization_id: profile.organization_id,
      email: profile.email,
    })

    return NextResponse.json({ success: true, role: profile.role })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 })
  }
}
