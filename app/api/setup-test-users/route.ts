import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    // Create Supabase Admin Client
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    const { error: orgError } = await supabaseAdmin.from("organizations").upsert(
      {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Hospital General",
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )

    if (orgError) {
      console.error("[v0] Error creating organization:", orgError)
    }

    const testUsers = [
      {
        email: "admin@hospital.com",
        password: "Test123!",
        full_name: "Admin Hospital",
        role: "org_admin",
      },
      {
        email: "pacientes@hospital.com",
        password: "Test123!",
        full_name: "Gestor de Pacientes",
        role: "patient_admin",
      },
      {
        email: "doctor@hospital.com",
        password: "Test123!",
        full_name: "Dr. Juan Pérez",
        role: "doctor",
      },
    ]

    const results = []

    for (const user of testUsers) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const userExists = existingUsers?.users.some((u) => u.email === user.email)

      if (userExists) {
        results.push({ email: user.email, status: "already_exists" })
        continue
      }

      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      })

      if (authError) {
        console.error("[v0] Auth error:", authError)
        results.push({ email: user.email, status: "error", message: authError.message })
        continue
      }

      const { error: profileError } = await supabaseAdmin.from("profiles").insert({
        id: authUser.user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        organization_id: "00000000-0000-0000-0000-000000000001",
      })

      if (profileError) {
        console.error("[v0] Profile error:", profileError)
        // If profile creation fails, try to delete the auth user to keep things clean
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        results.push({
          email: user.email,
          status: "error",
          message: `Profile creation failed: ${profileError.message}`,
        })
      } else {
        results.push({ email: user.email, status: "created", id: authUser.user.id })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("[v0] Error setting up test users:", error)
    return NextResponse.json(
      { error: "Failed to setup test users", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
