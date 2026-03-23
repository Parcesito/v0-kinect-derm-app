"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadFileDialog } from "@/components/upload-file-dialog"
import { CreateFolderDialog } from "@/components/create-folder-dialog"
import { FileItem } from "@/components/file-item"
import { FolderItem } from "@/components/folder-item"
import { FolderOpen, FileStack } from "lucide-react"

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

interface FileManagerProps {
  patientId: string
  folders: Folder[]
  files: File[]
  currentFolderId?: string | null
}

export function FileManager({ patientId, folders, files, currentFolderId }: FileManagerProps) {
  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <UploadFileDialog patientId={patientId} folderId={currentFolderId} />
        <CreateFolderDialog patientId={patientId} parentFolderId={currentFolderId} />
      </div>

      {/* Folders */}
      {folders.length > 0 && (
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
                <FolderItem key={folder.id} folder={folder} patientId={patientId} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                <FileItem key={file.id} file={file} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
