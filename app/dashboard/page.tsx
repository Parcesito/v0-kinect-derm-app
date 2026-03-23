import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/login")
  }

  // Redirect based on role
  if (session.role === "doctor") {
    redirect("/doctor/patients")
  } else if (session.role === "org_admin") {
    redirect("/admin/users")
  } else if (session.role === "patient_admin") {
    redirect("/admin/patients")
  }

  return null
}
