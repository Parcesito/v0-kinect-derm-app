"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Trash2, Box } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { PlyViewer } from "@/components/ply-viewer"

interface File {
  id: string
  filename: string
  blob_url: string
  file_size: number
  file_type: string
  wound_type: string | null
  wound_location: string | null
  notes: string | null
  scan_date: string
  created_at: string
}

interface Patient {
  first_name: string
  last_name: string
  date_of_birth: string
  identification_number?: string | null
  email?: string | null
  phone?: string | null
}

interface FileItemProps {
  file: File
  patient: Patient
}

const woundTypeLabels: Record<string, string> = {
  burn: "Quemadura",
  pressure_ulcer: "Úlcera por Presión",
  surgical: "Quirúrgica",
  traumatic: "Traumática",
  diabetic: "Diabética",
  venous: "Venosa",
  arterial: "Arterial",
  other: "Otra",
}

export function FileItem({ file, patient }: FileItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showViewer, setShowViewer] = useState(false)
  const { toast } = useToast()

  const isPly = file.filename.toLowerCase().endsWith(".ply")

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar el archivo "${file.filename}"?`)) return

    setIsDeleting(true)
    try {
      const response = await fetch("/api/files/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id }),
      })

      if (!response.ok) throw new Error("Error al eliminar archivo")

      toast({
        title: "Archivo eliminado",
        description: `${file.filename} ha sido eliminado exitosamente`,
      })

      window.dispatchEvent(new CustomEvent("refreshFiles"))
    } catch {
      toast({
        title: "Error",
        description: "Error al eliminar el archivo",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  const handleDownload = () => {
    window.open(file.blob_url, "_blank")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <>
      <div className="flex items-center gap-4 rounded-lg border p-4 hover:bg-slate-50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-900 truncate">{file.filename}</p>
            {isPly && (
              <Badge className="bg-cyan-100 text-cyan-700 text-xs shrink-0">3D</Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">{formatFileSize(file.file_size)}</span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-500">
              {new Date(file.scan_date).toLocaleDateString("es-ES")}
            </span>
            {file.wound_type && (
              <>
                <span className="text-xs text-slate-500">·</span>
                <Badge variant="secondary" className="text-xs">
                  {woundTypeLabels[file.wound_type]}
                </Badge>
              </>
            )}
          </div>
          {file.wound_location && (
            <p className="text-xs text-slate-500 mt-1">{file.wound_location}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isPly && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowViewer(true)}
              title="Visualizar en 3D"
              className="gap-1.5 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
            >
              <Box className="h-4 w-4" />
              <span className="text-xs font-medium">Visualizar</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            title="Descargar"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {isPly && (
        <PlyViewer
          file={file}
          patient={patient}
          open={showViewer}
          onClose={() => setShowViewer(false)}
        />
      )}
    </>
  )
}
