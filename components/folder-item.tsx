"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Folder } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface FolderItemProps {
  folder: {
    id: string
    name: string
    created_at: string
  }
  patientId: string
  onClick?: () => void
}

export function FolderItem({ folder, patientId, onClick }: FolderItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`¿Eliminar la carpeta "${folder.name}"? Esto eliminará todos los archivos dentro.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch("/api/folders/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: folder.id }),
      })

      if (!response.ok) {
        throw new Error("Error al eliminar carpeta")
      }

      toast({
        title: "Carpeta eliminada",
        description: `La carpeta "${folder.name}" ha sido eliminada`,
      })

      window.dispatchEvent(new CustomEvent('refreshFiles'))
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar la carpeta",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  return (
    <Card 
      className="p-4 hover:bg-slate-50 cursor-pointer group transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 shrink-0">
          <Folder className="h-5 w-5 text-cyan-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 truncate">{folder.name}</p>
          <p className="text-xs text-slate-500">{new Date(folder.created_at).toLocaleDateString("es-ES")}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 transition-opacity bg-transparent"
        >
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    </Card>
  )
}
