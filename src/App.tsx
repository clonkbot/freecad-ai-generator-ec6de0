import { useState, useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Float, MeshDistortMaterial, Text, Stars, Html, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

// Animated wireframe icosahedron representing AI processing
function AICore() {
  const meshRef = useRef<THREE.Mesh>(null!)
  const wireRef = useRef<THREE.LineSegments>(null!)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.1
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15
    }
    if (wireRef.current) {
      wireRef.current.rotation.x = -state.clock.elapsedTime * 0.08
      wireRef.current.rotation.y = -state.clock.elapsedTime * 0.12
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group>
        {/* Inner glowing core */}
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[1.2, 1]} />
          <MeshDistortMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.3}
            distort={0.3}
            speed={2}
          />
        </mesh>

        {/* Outer wireframe */}
        <lineSegments ref={wireRef}>
          <icosahedronGeometry args={[2, 1]} />
          <lineBasicMaterial color="#00ffff" transparent opacity={0.6} />
        </lineSegments>

        {/* Rotating rings */}
        <Ring radius={2.5} speed={0.5} color="#ff6b35" />
        <Ring radius={3} speed={-0.3} color="#00ffff" rotationAxis="x" />
        <Ring radius={3.5} speed={0.2} color="#7b68ee" rotationAxis="z" />
      </group>
    </Float>
  )
}

function Ring({ radius, speed, color, rotationAxis = 'y' }: { radius: number; speed: number; color: string; rotationAxis?: 'x' | 'y' | 'z' }) {
  const ref = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation[rotationAxis] = state.clock.elapsedTime * speed
    }
  })

  return (
    <mesh ref={ref} rotation={rotationAxis === 'x' ? [Math.PI / 2, 0, 0] : rotationAxis === 'z' ? [0, 0, Math.PI / 4] : [0, 0, 0]}>
      <torusGeometry args={[radius, 0.02, 8, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  )
}

// Grid floor with blueprint aesthetic
function BlueprintGrid() {
  return (
    <group position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <gridHelper args={[40, 40, '#1a4a5e', '#0d2833']} rotation={[Math.PI / 2, 0, 0]} />
      <mesh receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0a1a20" transparent opacity={0.8} />
      </mesh>
    </group>
  )
}

// Floating geometric shapes representing model formats
function FormatIcon({ position, format, color }: { position: [number, number, number]; format: string; color: string }) {
  const ref = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.2
      ref.current.rotation.y = state.clock.elapsedTime * 0.5
    }
  })

  const geometry = useMemo(() => {
    switch (format) {
      case 'STL':
        return <tetrahedronGeometry args={[0.4]} />
      case 'STEP':
        return <boxGeometry args={[0.5, 0.5, 0.5]} />
      case '3MF':
        return <octahedronGeometry args={[0.35]} />
      case 'IMG':
        return <planeGeometry args={[0.5, 0.5]} />
      default:
        return <sphereGeometry args={[0.3, 16, 16]} />
    }
  }, [format])

  return (
    <group
      ref={ref}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh scale={hovered ? 1.3 : 1}>
        {geometry}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          wireframe
        />
      </mesh>
      <Html center distanceFactor={10}>
        <div className={`text-xs font-mono px-2 py-1 rounded transition-all duration-300 ${hovered ? 'bg-cyan-500/30 text-cyan-300 scale-110' : 'bg-slate-900/50 text-slate-400'}`}>
          {format}
        </div>
      </Html>
    </group>
  )
}

// Animated data particles
function DataParticles() {
  const particlesRef = useRef<THREE.Points>(null!)
  const count = 200

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 4 + Math.random() * 3
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [])

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#00ffff" transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}

// Main UI Panel Component
function UIPanel({
  onUpload,
  isProcessing,
  uploadedFile,
  selectedFormat,
  onFormatChange,
  onGenerate
}: {
  onUpload: (file: File) => void
  isProcessing: boolean
  uploadedFile: File | null
  selectedFormat: string
  onFormatChange: (format: string) => void
  onGenerate: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) onUpload(file)
  }

  return (
    <div className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[340px] md:w-80">
      {/* Main Control Panel */}
      <div className="backdrop-blur-xl bg-slate-950/70 border border-cyan-500/30 rounded-lg overflow-hidden shadow-2xl shadow-cyan-500/10">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-900/50 to-slate-900/50 px-4 py-3 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="font-display text-cyan-300 text-sm tracking-wider uppercase">AI Model Generator</h2>
          </div>
          <p className="text-slate-500 text-xs mt-1 font-mono">FreeCAD Plugin v1.1</p>
        </div>

        {/* Upload Zone */}
        <div className="p-4">
          <div
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
              transition-all duration-300 group
              ${uploadedFile
                ? 'border-green-500/50 bg-green-950/20'
                : 'border-cyan-500/30 hover:border-cyan-400/60 hover:bg-cyan-950/20'
              }
            `}
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.3mf,.stl,.step,.stp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
            />

            {uploadedFile ? (
              <>
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-400 text-sm font-medium truncate">{uploadedFile.name}</p>
                <p className="text-slate-500 text-xs mt-1">Click to replace</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-slate-300 text-sm font-medium">Drop files here</p>
                <p className="text-slate-500 text-xs mt-1">PNG, JPG, 3MF, STL, STEP</p>
              </>
            )}
          </div>
        </div>

        {/* Format Selection */}
        <div className="px-4 pb-4">
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block font-mono">Output Format</label>
          <div className="grid grid-cols-4 gap-2">
            {['STL', 'STEP', '3MF', 'OBJ'].map((format) => (
              <button
                key={format}
                onClick={() => onFormatChange(format)}
                className={`
                  py-2 px-3 rounded text-xs font-mono transition-all duration-200
                  ${selectedFormat === format
                    ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300 border border-slate-700/50'
                  }
                `}
              >
                {format}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="p-4 pt-0">
          <button
            onClick={onGenerate}
            disabled={!uploadedFile || isProcessing}
            className={`
              w-full py-3 px-4 rounded-lg font-display text-sm uppercase tracking-wider
              transition-all duration-300 relative overflow-hidden
              ${!uploadedFile || isProcessing
                ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-900 hover:shadow-lg hover:shadow-cyan-500/40 hover:-translate-y-0.5'
              }
            `}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </span>
            ) : (
              'Generate 3D Model'
            )}
          </button>
        </div>

        {/* Status */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-cyan-400'}`} />
            <span>{isProcessing ? 'AI Processing...' : 'Ready'}</span>
          </div>
        </div>
      </div>

      {/* Decorative corner brackets */}
      <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50" />
      <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50" />
      <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50" />
      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50" />
    </div>
  )
}

// Info Panel
function InfoPanel() {
  return (
    <div className="absolute right-4 md:right-8 top-8 max-w-[280px] md:w-64 hidden md:block">
      <div className="backdrop-blur-xl bg-slate-950/50 border border-slate-700/50 rounded-lg p-4">
        <h3 className="text-cyan-400 text-xs uppercase tracking-wider font-mono mb-3">System Status</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">AI Engine</span>
            <span className="text-green-400">Online</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">GPU Memory</span>
            <span className="text-cyan-400">4.2 GB</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Model Quality</span>
            <span className="text-cyan-400">High</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <h4 className="text-slate-400 text-xs mb-2">Supported Inputs</h4>
          <div className="flex flex-wrap gap-1">
            {['PNG', 'JPG', '3MF', 'STL', 'STEP'].map((fmt) => (
              <span key={fmt} className="px-2 py-0.5 bg-slate-800/50 text-cyan-400 text-xs rounded font-mono">
                {fmt}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Main App
export default function App() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [selectedFormat, setSelectedFormat] = useState('STL')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleUpload = (file: File) => {
    setUploadedFile(file)
  }

  const handleGenerate = () => {
    if (!uploadedFile) return
    setIsProcessing(true)
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false)
    }, 3000)
  }

  return (
    <div className="w-screen h-screen bg-slate-950 overflow-hidden relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-cyan-950/30 via-slate-950 to-slate-950" />

      {/* Blueprint grid overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50 }}
        className="absolute inset-0"
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ffff" />
          <pointLight position={[-10, -10, -10]} intensity={0.3} color="#ff6b35" />
          <spotLight position={[0, 10, 0]} intensity={0.5} color="#7b68ee" angle={0.5} penumbra={1} />

          {/* Main AI Core */}
          <AICore />

          {/* Format icons */}
          <FormatIcon position={[-4, 1.5, -2]} format="STL" color="#ff6b35" />
          <FormatIcon position={[4, 2, -1]} format="STEP" color="#7b68ee" />
          <FormatIcon position={[-3, -0.5, 2]} format="3MF" color="#00ff88" />
          <FormatIcon position={[3.5, 0, 2]} format="IMG" color="#ff4488" />

          {/* Particles */}
          <DataParticles />

          {/* Grid floor */}
          <BlueprintGrid />

          {/* Stars background */}
          <Stars radius={100} depth={50} count={2000} factor={4} fade speed={0.5} />

          {/* Contact shadows */}
          <ContactShadows
            position={[0, -3, 0]}
            opacity={0.4}
            scale={20}
            blur={2}
            color="#00ffff"
          />

          {/* Controls */}
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={20}
            maxPolarAngle={Math.PI / 1.5}
          />

          {/* Environment */}
          <Environment preset="night" />
        </Suspense>
      </Canvas>

      {/* Title */}
      <div className="absolute top-4 md:top-8 left-4 md:left-8 right-4 md:right-auto">
        <h1 className="font-display text-xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 tracking-tight">
          FreeCAD AI
        </h1>
        <p className="text-slate-500 text-xs md:text-sm font-mono mt-1">Neural Model Generation Engine</p>
      </div>

      {/* UI Panel */}
      <UIPanel
        onUpload={handleUpload}
        isProcessing={isProcessing}
        uploadedFile={uploadedFile}
        selectedFormat={selectedFormat}
        onFormatChange={setSelectedFormat}
        onGenerate={handleGenerate}
      />

      {/* Info Panel */}
      <InfoPanel />

      {/* Footer */}
      <footer className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-slate-600 text-xs font-mono">
          Requested by @web-user · Built by @clonkbot
        </p>
      </footer>

      {/* Scan line effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.1) 2px, rgba(0, 255, 255, 0.1) 4px)'
        }}
      />
    </div>
  )
}
