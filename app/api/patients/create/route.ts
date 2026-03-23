import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.role !== "patient_admin") {
      return NextResponse.json({ error: "No tienes permisos para crear pacientes" }, { status: 403 })
    }

    const supabase = await createClient()
    const { firstName, lastName, identificationNumber, dateOfBirth, email, phone, address } = await request.json()

    // Build patient data object, only including identification_number if provided
    const patientData: Record<string, unknown> = {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      email: email || null,
      phone: phone || null,
      address: address || null,
      created_by: session.id,
    }

    // Only add identification_number if it exists and column is available
    if (identificationNumber) {
      patientData.identification_number = identificationNumber
    }

    // Create patient
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .insert(patientData)
      .select()
      .single()

    if (patientError) {
      throw patientError
    }

    return NextResponse.json({
      success: true,
      patient,
    })
  } catch (error: unknown) {
    console.error("Create patient error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear paciente" },
      { status: 500 },
    )
  }
}
