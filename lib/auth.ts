import { getSession, requireAuth as requireSession, getProfile as getProfileFromSession } from "@/lib/session"
import { redirect } from "next/navigation"

export async function requireAuth() {
  try {
    return await requireSession()
  } catch {
    redirect("/auth/login")
  }
}

export async function getProfile() {
  return await getProfileFromSession()
}

export async function getCurrentUser() {
  return await getSession()
}
