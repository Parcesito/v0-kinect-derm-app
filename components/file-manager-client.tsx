"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UploadFileDialog } from "@/components/upload-file-dialog"
import { CreateFolderDialog } from "@/components/create-folder-dialog"
import { FileItem } from "@/components/file-item"
import { FolderItem } from "@/components/folder-item"
import { FolderOpen, FileStack, ChevronLeft, Home } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Folder {
  id: string
  name: string
  created_at: string
}

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

interface FileManagerClientProps {
  patientId: string
  patient: Patient
  initialFolders: Folder[]
  initialFiles: File[]
  currentFolderId?: string | null
}

export function FileManagerClient({ 
  patientId, 
  patient,
  initialFolders, 
  initialFiles, 
  currentFolderId 
}: FileManagerClientProps) {
  const [folders, setFolders] = useState(initialFolders)
  const [files, setFiles] = useState(initialFiles)
  const [activeFolderId, setActiveFolderId] = useState<string | null>(currentFolderId || null)
  const [folderPath, setFolderPath] = useState<Array<{id: string, name: string}>>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const loadFolderContents = async (folderId: string | null) => {
    setIsLoading(true)
    try {
      const url = folderId 
        ? `/api/files/list?patientId=${patientId}&folderId=${folderId}`
        : `/api/files/list?patientId=${patientId}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setFolders(data.folders || [])
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error('[v0] Error loading folder:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar el contenido de la carpeta",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFolderClick = (folder: { id: string; name: string }) => {
    setActiveFolderId(folder.id)
    setFolderPath(prev => [...prev, folder])
    loadFolderContents(folder.id)
    
    // Update URL without reloading
    router.push(`/doctor/patients/${patientId}/folders/${folder.id}`, { scroll: false })
  }

  const handleGoBack = () => {
    const newPath = [...folderPath]
    newPath.pop()
    setFolderPath(newPath)
    
    const parentFolder = newPath[newPath.length - 1]
    const newFolderId = parentFolder?.id || null
    setActiveFolderId(newFolderId)
    loadFolderContents(newFolderId)
    
    // Update URL
    if (newFolderId) {
      router.push(`/doctor/patients/${patientId}/folders/${newFolderId}`, { scroll: false })
    } else {
      router.push(`/doctor/patients/${patientId}`, { scroll: false })
    }
  }

  const handleGoHome = () => {
    setFolderPath([])
    setActiveFolderId(null)
    loadFolderContents(null)
    router.push(`/doctor/patients/${patientId}`, { scroll: false })
  }

  useEffect(() => {
    const handleRefresh = async () => {
      await loadFolderContents(activeFolderId)
    }

    window.addEventListener('refreshFiles', handleRefresh)
    return () => window.removeEventListener('refreshFiles', handleRefresh)
  }, [patientId, activeFolderId])

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      {folderPath.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoHome}
            className="bg-transparent h-8 px-2"
          >
            <Home className="h-4 w-4" />
          </Button>
          <span className="text-slate-400">/</span>
          {folderPath.map((folder, index) => (
            <div key={folder.id} className="flex items-center gap-2">
              <span className="text-slate-700">{folder.name}</span>
              {index < folderPath.length - 1 && <span className="text-slate-400">/</span>}
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="bg-transparent ml-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Atrás
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <UploadFileDialog patientId={patientId} folderId={activeFolderId} />
        <CreateFolderDialog patientId={patientId} parentFolderId={activeFolderId} />
      </div>

      {/* Folders */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            Cargando...
          </CardContent>
        </Card>
      ) : folders.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderOpen className="h-5 w-5 text-cyan-600" />
              Carpetas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {folders.map((folder) => (
                <FolderItem 
                  key={folder.id} 
                  folder={folder} 
                  patientId={patientId} 
                  onClick={() => handleFolderClick(folder)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileStack className="h-5 w-5 text-cyan-600" />
            Archivos ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-8">No hay archivos en esta ubicación</p>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <FileItem key={file.id} file={file} patient={patient} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
