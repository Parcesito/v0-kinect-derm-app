import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export type UserSession = {
  id: string
  username: string
  full_name: string
  role: "doctor" | "org_admin" | "patient_admin"
  organization_id: string
  email: string
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("kinect_session")

  if (!sessionCookie) {
    return null
  }

  try {
    const session = JSON.parse(sessionCookie.value) as UserSession
    return session
  } catch {
    return null
  }
}

export async function setSession(user: UserSession) {
  const cookieStore = await cookies()
  cookieStore.set("kinect_session", JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete("kinect_session")
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}

export async function getProfile() {
  const session = await getSession()
  if (!session) {
    return null
  }

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organization:organizations(*)")
    .eq("id", session.id)
    .single()

  return profile
}
