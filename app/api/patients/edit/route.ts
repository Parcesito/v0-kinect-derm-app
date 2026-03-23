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
      return NextResponse.json({ error: "No tienes permisos para editar pacientes" }, { status: 403 })
    }

    const { patientId, firstName, lastName, identificationNumber, dateOfBirth, email, phone, address } =
      await request.json()

    const supabase = await createClient()

    // Update patient
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .update({
        first_name: firstName,
        last_name: lastName,
        identification_number: identificationNumber,
        date_of_birth: dateOfBirth,
        email: email || null,
        phone: phone || null,
        address: address || null,
      })
      .eq("id", patientId)
      .select()
      .single()

    if (patientError) {
      throw new Error("Error al actualizar el paciente")
    }

    return NextResponse.json({ patient })
  } catch (error: unknown) {
    console.error("[v0] Edit patient error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al editar paciente" },
      { status: 500 },
    )
  }
}
