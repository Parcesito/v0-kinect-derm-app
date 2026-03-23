import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Validate session server-side before issuing upload token
        const session = await getSession()

        if (!session) {
          throw new Error("No autorizado")
        }

        if (session.role !== "doctor") {
          throw new Error("Solo los doctores pueden cargar archivos")
        }

        return {
          allowedContentTypes: ["application/octet-stream", "model/ply", "text/plain"],
          maximumSizeInBytes: 200 * 1024 * 1024, // 200MB
          tokenPayload: clientPayload ?? "",
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This runs after the file has been uploaded to Blob
        // Save metadata to Supabase
        try {
          const supabase = await createClient()
          const metadata = JSON.parse(tokenPayload ?? "{}")

          const { error } = await supabase.from("files").insert({
            filename: blob.pathname.split("/").pop() ?? blob.pathname,
            blob_url: blob.url,
            file_size: metadata.fileSize ?? 0,
            file_type: metadata.fileType ?? "",
            patient_id: metadata.patientId,
            folder_id: metadata.folderId ?? null,
            wound_type: metadata.woundType ?? null,
            wound_location: metadata.woundLocation ?? null,
            notes: metadata.notes ?? null,
            scan_date: metadata.scanDate ?? new Date().toISOString(),
            uploaded_by: metadata.uploadedBy ?? null,
          })

          if (error) {
            console.error("Error saving file metadata:", error)
            throw error
          }
        } catch (err) {
          console.error("onUploadCompleted error:", err)
          throw err
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al cargar archivo" },
      { status: 400 },
    )
  }
}
