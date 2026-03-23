"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

export default function SetupPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSetup = async () => {
    setStatus("loading")
    setMessage("")

    try {
      const response = await fetch("/api/setup-test-users", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear usuarios")
      }

      setStatus("success")
      setMessage("Usuarios de prueba creados exitosamente")
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Error desconocido")
      console.error("[v0] Setup error:", error)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-cyan-600">Configuración Inicial</CardTitle>
          <CardDescription>Crea los usuarios de prueba para Kinect Derm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Haz clic en el botón de abajo para crear los usuarios de prueba en la base de datos.
            </p>

            <Button
              onClick={handleSetup}
              disabled={status === "loading" || status === "success"}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              {status === "loading"
                ? "Creando usuarios..."
                : status === "success"
                  ? "Usuarios creados"
                  : "Crear Usuarios de Prueba"}
            </Button>

            {message && (
              <div
                className={`rounded-md p-3 text-sm ${
                  status === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                }`}
              >
                {message}
              </div>
            )}

            {status === "success" && (
              <div className="rounded-lg bg-cyan-50 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-cyan-900">Credenciales creadas:</h3>
                <div className="space-y-2 text-xs text-cyan-800">
                  <div className="flex flex-col gap-1">
                    <strong>Admin de Organización:</strong>
                    <span>Email: admin@hospital.com</span>
                    <span>Contraseña: Test123!</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <strong>Gestor de Pacientes:</strong>
                    <span>Email: pacientes@hospital.com</span>
                    <span>Contraseña: Test123!</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <strong>Doctor:</strong>
                    <span>Email: doctor@hospital.com</span>
                    <span>Contraseña: Test123!</span>
                  </div>
                </div>
                <Button
                  onClick={() => (window.location.href = "/auth/login")}
                  className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700"
                >
                  Ir a Iniciar Sesión
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
