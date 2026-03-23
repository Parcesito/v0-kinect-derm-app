"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { upload } from "@vercel/blob/client"

interface UploadFileDialogProps {
  patientId: string
  folderId?: string | null
}

export function UploadFileDialog({ patientId, folderId }: UploadFileDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [woundType, setWoundType] = useState("")
  const [woundLocation, setWoundLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [scanDate, setScanDate] = useState(new Date().toISOString().split("T")[0])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsLoading(true)
    setUploadProgress(0)

    try {
      // Metadata sent as clientPayload — never touches the serverless function body size limit
      const clientPayload = JSON.stringify({
        patientId,
        folderId: folderId ?? null,
        woundType: woundType || null,
        woundLocation: woundLocation || null,
        notes: notes || null,
        scanDate,
        fileSize: file.size,
        fileType: file.type,
      })

      // Upload goes browser → Vercel Blob directly, bypassing the 4.5MB serverless limit
      const blob = await upload(`patients/${patientId}/${Date.now()}_${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/files/upload",
        clientPayload,
        onUploadProgress: ({ percentage }) => {
          setUploadProgress(Math.round(percentage))
        },
      })

      // NEW: Manual sync to ensure metadata is saved in local development
      // where onUploadCompleted might fail to reach localhost
      await fetch("/api/files/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blob,
          metadata: JSON.parse(clientPayload),
        }),
      })

      toast({
        title: "Archivo cargado",
        description: `${file.name} se ha cargado exitosamente`,
      })

      setOpen(false)
      setFile(null)
      setWoundType("")
      setWoundLocation("")
      setNotes("")
      setScanDate(new Date().toISOString().split("T")[0])
      setUploadProgress(0)
      window.dispatchEvent(new CustomEvent("refreshFiles"))
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar archivo",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-cyan-600 hover:bg-cyan-700 gap-2">
          <Upload className="h-4 w-4" />
          Cargar Archivo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cargar Archivo de Escaneo</DialogTitle>
          <DialogDescription>Carga un archivo de escaneo de herida (máx. 200MB)</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Archivo</Label>
            <Input id="file" type="file" required onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file && (
              <p className="text-xs text-slate-500">
                {file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>

          {isLoading && uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subiendo archivo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-cyan-600 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="scanDate">Fecha de Escaneo</Label>
            <Input id="scanDate" type="date" value={scanDate} onChange={(e) => setScanDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="woundType">Tipo de Herida</Label>
            <Select value={woundType} onValueChange={setWoundType}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="burn">Quemadura</SelectItem>
                <SelectItem value="pressure_ulcer">Úlcera por Presión</SelectItem>
                <SelectItem value="surgical">Quirúrgica</SelectItem>
                <SelectItem value="traumatic">Traumática</SelectItem>
                <SelectItem value="diabetic">Diabética</SelectItem>
                <SelectItem value="venous">Venosa</SelectItem>
                <SelectItem value="arterial">Arterial</SelectItem>
                <SelectItem value="other">Otra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="woundLocation">Ubicación de la Herida</Label>
            <Input
              id="woundLocation"
              placeholder="Ej: Pierna izquierda, muslo anterior"
              value={woundLocation}
              onChange={(e) => setWoundLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones adicionales..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              disabled={isLoading || !file}
            >
              {isLoading ? `Subiendo ${uploadProgress > 0 ? `${uploadProgress}%` : "..."}` : "Cargar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
