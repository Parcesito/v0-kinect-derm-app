import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { CreateUserForm } from "@/components/create-user-form"
import { UsersList } from "@/components/users-list"
import { LogoutButton } from "@/components/logout-button"

export default async function UsersManagementPage() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/login")
  }

  // Verify they're an org admin
  if (session.role !== "org_admin") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  // Get user profile with organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(name)")
    .eq("id", session.id)
    .single()

  // Get all users in the organization
  const { data: orgUsers } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-cyan-600">Kinect Derm</h1>
            <p className="text-sm text-slate-600">{profile.organizations?.name || "Organización"}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{session.full_name}</p>
              <p className="text-xs text-slate-600">Administrador de Organización</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Gestión de Usuarios</h2>
          <p className="text-slate-600 mt-2">Crea y administra usuarios para tu organización</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Create User Form */}
          <div>
            <CreateUserForm organizationId={profile.organization_id!} />
          </div>

          {/* Users List */}
          <div>
            <UsersList users={orgUsers || []} />
          </div>
        </div>
      </main>
    </div>
  )
}
