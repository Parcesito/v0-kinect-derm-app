"use client"

import { Suspense, useEffect, useRef, useState, Component, type ReactNode } from "react"
import { Canvas, useLoader, useThree } from "@react-three/fiber"
import { OrbitControls, Center } from "@react-three/drei"

// ---- Error Boundary ------------------------------------------------------

class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("3D Viewer Error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js"
import * as THREE from "three"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"

// ---- Types ----------------------------------------------------------------

interface FileData {
  filename: string
  blob_url: string
  wound_type: string | null
  wound_location: string | null
  notes: string | null
  scan_date: string
}

interface PatientData {
  first_name: string
  last_name: string
  date_of_birth: string
  identification_number?: string | null
  email?: string | null
  phone?: string | null
}

interface PlyViewerProps {
  file: FileData
  patient: PatientData
  open: boolean
  onClose: () => void
}

// ---- Labels ---------------------------------------------------------------

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

// ---- PLY Mesh Component ---------------------------------------------------

function PlyMesh({ url }: { url: string }) {
  const geometry = useLoader(PLYLoader, url)
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()

  useEffect(() => {
    if (!geometry) return

    geometry.computeVertexNormals()

    // Fit camera to geometry
    geometry.computeBoundingBox()
    const box = geometry.boundingBox!
    const center = new THREE.Vector3()
    box.getCenter(center)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(center.x, center.y, center.z + maxDim * 2)
      camera.near = maxDim * 0.001
      camera.far = maxDim * 100
      camera.updateProjectionMatrix()
    }

    // Center the geometry
    geometry.translate(-center.x, -center.y, -center.z)
  }, [geometry, camera])

  // Use vertex colors if present, otherwise use a neutral skin-tone material
  const hasVertexColors = geometry.attributes.color !== undefined

  const material = hasVertexColors
    ? new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.7,
      metalness: 0.0,
    })
    : new THREE.MeshStandardMaterial({
      color: "#d4a574",
      roughness: 0.7,
      metalness: 0.0,
    })

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} castShadow receiveShadow />
  )
}

// ---- Loading indicator inside canvas ------------------------------------

function LoadingMesh() {
  return (
    <mesh>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color="#06b6d4" wireframe />
    </mesh>
  )
}

// ---- Camera reset helper ------------------------------------------------

function CameraResetter({ trigger }: { trigger: number }) {
  const { camera, scene } = useThree()

  useEffect(() => {
    if (trigger === 0) return
    const box = new THREE.Box3().setFromObject(scene)
    const center = new THREE.Vector3()
    box.getCenter(center)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    camera.position.set(0, 0, maxDim * 2)
    camera.lookAt(0, 0, 0)
  }, [trigger, camera, scene])

  return null
}

// ---- Age helper ---------------------------------------------------------

function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// ---- Main Component ------------------------------------------------------

export function PlyViewer({ file, patient, open, onClose }: PlyViewerProps) {
  const [resetTrigger, setResetTrigger] = useState(0)
  const [loadError, setLoadError] = useState(false)
  const controlsRef = useRef<any>(null)

  // Reset error state when a new file is opened
  useEffect(() => {
    if (open) setLoadError(false)
  }, [open, file.blob_url])

  const handleReset = () => setResetTrigger((t) => t + 1)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[80vw] w-[80vw] sm:max-w-none h-[85vh] p-0 gap-0 flex flex-col overflow-hidden">
        {/* Accessible title (visually hidden is fine here) */}
        <DialogTitle className="sr-only">Visualización 3D – {file.filename}</DialogTitle>
        <DialogDescription className="sr-only">Explora la reconstrucción 3D de la herida del paciente.</DialogDescription>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800 truncate max-w-[400px]">{file.filename}</span>
            <Badge variant="secondary" className="text-xs font-mono">PLY 3D</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="bg-transparent">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body: 3D canvas + right panel */}
        <div className="flex flex-1 overflow-hidden">

          {/* 3D Viewport */}
          <div className="relative flex-1 bg-slate-900">
            {loadError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
                <p className="text-sm">No se pudo cargar el archivo 3D.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(file.blob_url, "_blank")}
                >
                  Descargar archivo
                </Button>
              </div>
            ) : (
              <ErrorBoundary
                fallback={
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                    <p className="text-sm">Error crítico en el motor 3D.</p>
                    <p className="text-xs mt-2 max-w-[200px]">Es posible que el archivo esté corrupto o haya un problema de memoria.</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
                      Recargar página
                    </Button>
                  </div>
                }
              >
                <Canvas
                  camera={{ position: [0, 0, 2], fov: 50 }}
                  shadows
                  gl={{ antialias: true }}
                  className="w-full h-full"
                  onError={() => setLoadError(true)}
                >
                  {/* Lighting */}
                  <ambientLight intensity={0.6} />
                  <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
                  <directionalLight position={[-5, -5, -5]} intensity={0.3} />

                  {/* Model */}
                  <Suspense fallback={<LoadingMesh />}>
                    <Center>
                      <PlyMesh url={file.blob_url} />
                    </Center>
                  </Suspense>

                  {/* Helpers */}
                  <CameraResetter trigger={resetTrigger} />
                  <OrbitControls
                    ref={controlsRef}
                    makeDefault
                    minDistance={0.1}
                    maxDistance={10}
                  />
                </Canvas>
              </ErrorBoundary>
            )}

            {/* Viewport controls overlay */}
            {!loadError && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReset}
                  title="Restablecer vista"
                  className="shadow-md"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Loading hint */}
            {!loadError && (
              <div className="absolute top-4 left-4 text-xs text-slate-400 pointer-events-none">
                Clic y arrastra para rotar · Scroll para zoom
              </div>
            )}
          </div>

          {/* Right panel: patient + scan info */}
          <aside className="w-72 shrink-0 bg-white border-l flex flex-col overflow-y-auto">

            {/* Patient */}
            <div className="px-5 py-4 border-b">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Paciente</p>
              {patient ? (
                <>
                  <p className="font-bold text-slate-900 text-lg leading-tight">
                    {patient.first_name} {patient.last_name}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">{calculateAge(patient.date_of_birth)} años</p>
                  {patient.identification_number && (
                    <p className="text-sm text-slate-500 mt-0.5">ID: {patient.identification_number}</p>
                  )}
                  {patient.email && (
                    <p className="text-sm text-slate-500 mt-0.5 truncate">{patient.email}</p>
                  )}
                  {patient.phone && (
                    <p className="text-sm text-slate-500 mt-0.5">{patient.phone}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400 italic">Información del paciente no disponible</p>
              )}
            </div>

            {/* Scan info */}
            <div className="px-5 py-4 border-b">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Datos del Escaneo</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-400">Fecha</p>
                  <p className="text-sm font-medium text-slate-800">
                    {new Date(file.scan_date).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {file.wound_type && (
                  <div>
                    <p className="text-xs text-slate-400">Tipo de Herida</p>
                    <p className="text-sm font-medium text-slate-800">
                      {woundTypeLabels[file.wound_type] ?? file.wound_type}
                    </p>
                  </div>
                )}
                {file.wound_location && (
                  <div>
                    <p className="text-xs text-slate-400">Ubicación</p>
                    <p className="text-sm font-medium text-slate-800">{file.wound_location}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {file.notes && (
              <div className="px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Observaciones</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{file.notes}</p>
              </div>
            )}

            {!file.notes && (
              <div className="px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Observaciones</p>
                <p className="text-sm text-slate-400 italic">Sin observaciones registradas.</p>
              </div>
            )}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}
