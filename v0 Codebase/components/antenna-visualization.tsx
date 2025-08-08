"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from 'lucide-react'

interface AntennaData {
  type: string
  frequency: number
  elements: number
  elementLength: number
  elementSpacing: number
  feedPoint: string
  material: string
}

export default function AntennaVisualization({ antennaData }: { antennaData: AntennaData }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f5f5)
    sceneRef.current = scene

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 5
    cameraRef.current = camera

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controlsRef.current = controls

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 1)
    scene.add(directionalLight)

    // Add grid helper
    const gridHelper = new THREE.GridHelper(10, 10)
    scene.add(gridHelper)

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return
      
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
    }
  }, [])

  useEffect(() => {
    if (!sceneRef.current) return

    // Clear previous antenna model
    const scene = sceneRef.current
    scene.children = scene.children.filter(
      (child) => !(child instanceof THREE.Mesh) || child.userData.isPermanent
    )

    // Add ambient and directional light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 1)
    scene.add(directionalLight)

    // Add grid helper
    const gridHelper = new THREE.GridHelper(10, 10)
    scene.add(gridHelper)

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    // Material color based on selected material
    const materialColors = {
      copper: 0xb87333,
      aluminum: 0xd3d3d3,
      steel: 0x71797e,
      gold: 0xffd700,
      silver: 0xc0c0c0,
    }
    
    const materialColor = materialColors[antennaData.material as keyof typeof materialColors] || 0xb87333

    // Create antenna based on type
    switch (antennaData.type) {
      case "dipole":
        createDipoleAntenna(scene, antennaData, materialColor)
        break
      case "yagi":
        createYagiAntenna(scene, antennaData, materialColor)
        break
      case "patch":
        createPatchAntenna(scene, antennaData, materialColor)
        break
      case "logperiodic":
        createLogPeriodicAntenna(scene, antennaData, materialColor)
        break
      case "helical":
        createHelicalAntenna(scene, antennaData, materialColor)
        break
      default:
        createDipoleAntenna(scene, antennaData, materialColor)
    }
  }, [antennaData])

  const createDipoleAntenna = (
    scene: THREE.Scene,
    antennaData: AntennaData,
    materialColor: number
  ) => {
    const material = new THREE.MeshStandardMaterial({ color: materialColor })
    
    // Create the dipole elements
    const elementLength = antennaData.elementLength
    const elementRadius = 0.03
    
    // Create the two dipole arms
    const geometry = new THREE.CylinderGeometry(elementRadius, elementRadius, elementLength / 2, 16)
    
    // First arm
    const arm1 = new THREE.Mesh(geometry, material)
    arm1.position.set(0, elementLength / 4, 0)
    arm1.rotation.x = Math.PI / 2
    scene.add(arm1)
    
    // Second arm
    const arm2 = new THREE.Mesh(geometry, material)
    arm2.position.set(0, -elementLength / 4, 0)
    arm2.rotation.x = Math.PI / 2
    scene.add(arm2)
    
    // Feed point indicator
    const feedGeometry = new THREE.SphereGeometry(elementRadius * 1.5, 16, 16)
    const feedMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    const feedPoint = new THREE.Mesh(feedGeometry, feedMaterial)
    feedPoint.position.set(0, 0, 0)
    scene.add(feedPoint)
  }

  const createYagiAntenna = (
    scene: THREE.Scene,
    antennaData: AntennaData,
    materialColor: number
  ) => {
    const material = new THREE.MeshStandardMaterial({ color: materialColor })
    const elementRadius = 0.03
    const boomRadius = 0.05
    
    // Create boom (horizontal support)
    const boomLength = (antennaData.elements - 1) * antennaData.elementSpacing + 0.5
    const boomGeometry = new THREE.CylinderGeometry(boomRadius, boomRadius, boomLength, 16)
    const boom = new THREE.Mesh(boomGeometry, material)
    boom.rotation.z = Math.PI / 2
    scene.add(boom)
    
    // Create elements
    for (let i = 0; i < antennaData.elements; i++) {
      // Element length decreases from reflector to directors
      let elementLength
      if (i === 0) {
        // Reflector is longer
        elementLength = antennaData.elementLength * 1.05
      } else if (i === 1) {
        // Driven element
        elementLength = antennaData.elementLength
      } else {
        // Directors get progressively shorter
        elementLength = antennaData.elementLength * (0.95 - (i - 2) * 0.02)
      }
      
      const elementGeometry = new THREE.CylinderGeometry(elementRadius, elementRadius, elementLength, 16)
      const element = new THREE.Mesh(elementGeometry, material)
      
      // Position along the boom
      const xPos = -boomLength / 2 + i * antennaData.elementSpacing
      element.position.set(xPos, 0, 0)
      
      // Rotate to be perpendicular to boom
      element.rotation.x = Math.PI / 2
      
      scene.add(element)
      
      // Add feed point to the driven element
      if (i === 1) {
        const feedGeometry = new THREE.SphereGeometry(elementRadius * 1.5, 16, 16)
        const feedMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
        const feedPoint = new THREE.Mesh(feedGeometry, feedMaterial)
        feedPoint.position.set(xPos, 0, 0)
        scene.add(feedPoint)
      }
    }
  }

  const createPatchAntenna = (
    scene: THREE.Scene,
    antennaData: AntennaData,
    materialColor: number
  ) => {
    // Create ground plane
    const groundSize = antennaData.elementLength * 2
    const groundGeometry = new THREE.BoxGeometry(groundSize, groundSize, 0.05)
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 })
    const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial)
    groundPlane.position.set(0, 0, -0.1)
    scene.add(groundPlane)
    
    // Create patch
    const patchSize = antennaData.elementLength
    const patchGeometry = new THREE.BoxGeometry(patchSize, patchSize, 0.02)
    const patchMaterial = new THREE.MeshStandardMaterial({ color: materialColor })
    const patch = new THREE.Mesh(patchGeometry, patchMaterial)
    patch.position.set(0, 0, 0)
    scene.add(patch)
    
    // Create feed line
    const feedWidth = 0.1
    const feedLength = patchSize / 2
    const feedGeometry = new THREE.BoxGeometry(feedWidth, feedLength, 0.02)
    const feedMaterial = new THREE.MeshStandardMaterial({ color: materialColor })
    const feed = new THREE.Mesh(feedGeometry, feedMaterial)
    
    // Position feed based on feed point
    if (antennaData.feedPoint === "center") {
      feed.position.set(0, -patchSize / 2 - feedLength / 2, 0)
    } else if (antennaData.feedPoint === "offset") {
      feed.position.set(patchSize / 4, -patchSize / 2 - feedLength / 2, 0)
    } else {
      feed.position.set(patchSize / 2 - feedWidth / 2, -patchSize / 2 - feedLength / 2, 0)
    }
    
    scene.add(feed)
    
    // Feed point indicator
    const feedPointGeometry = new THREE.SphereGeometry(0.05, 16, 16)
    const feedPointMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    const feedPoint = new THREE.Mesh(feedPointGeometry, feedPointMaterial)
    feedPoint.position.set(feed.position.x, -patchSize / 2, 0.05)
    scene.add(feedPoint)
  }

  const createLogPeriodicAntenna = (
    scene: THREE.Scene,
    antennaData: AntennaData,
    materialColor: number
  ) => {
    const material = new THREE.MeshStandardMaterial({ color: materialColor })
    const elementRadius = 0.03
    const boomRadius = 0.05
    
    // Create booms (two parallel supports)
    const boomLength = antennaData.elements * antennaData.elementSpacing
    const boomGeometry = new THREE.CylinderGeometry(boomRadius, boomRadius, boomLength, 16)
    
    const boom1 = new THREE.Mesh(boomGeometry, material)
    boom1.rotation.z = Math.PI / 2
    boom1.position.set(0, 0.2, 0)
    scene.add(boom1)
    
    const boom2 = new THREE.Mesh(boomGeometry, material)
    boom2.rotation.z = Math.PI / 2
    boom2.position.set(0, -0.2, 0)
    scene.add(boom2)
    
    // Create elements with decreasing length and spacing
    const tau = 0.8 // Scaling factor
    let currentLength = antennaData.elementLength
    
    for (let i = 0; i < antennaData.elements; i++) {
      const elementGeometry = new THREE.CylinderGeometry(elementRadius, elementRadius, currentLength, 16)
      const element = new THREE.Mesh(elementGeometry, material)
      
      // Position along the boom
      const xPos = -boomLength / 2 + i * antennaData.elementSpacing * Math.pow(tau, i)
      element.position.set(xPos, 0, 0)
      
      // Rotate to be perpendicular to boom
      element.rotation.x = Math.PI / 2
      
      scene.add(element)
      
      // Reduce length for next element
      currentLength *= tau
      
      // Add feed point to the middle element
      if (i === Math.floor(antennaData.elements / 2)) {
        const feedGeometry = new THREE.SphereGeometry(elementRadius * 1.5, 16, 16)
        const feedMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
        const feedPoint = new THREE.Mesh(feedGeometry, feedMaterial)
        feedPoint.position.set(xPos, 0, 0)
        scene.add(feedPoint)
      }
    }
  }

  const createHelicalAntenna = (
    scene: THREE.Scene,
    antennaData: AntennaData,
    materialColor: number
  ) => {
    const material = new THREE.MeshStandardMaterial({ color: materialColor })
    
    // Create ground plane
    const groundSize = antennaData.elementLength * 1.5
    const groundGeometry = new THREE.CylinderGeometry(groundSize / 2, groundSize / 2, 0.05, 32)
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 })
    const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial)
    groundPlane.position.set(0, -0.5, 0)
    groundPlane.rotation.x = Math.PI / 2
    scene.add(groundPlane)
    
    // Create helical coil
    const coilRadius = antennaData.elementLength / 4
    const coilTurns = antennaData.elements
    const coilHeight = coilTurns * antennaData.elementSpacing
    const coilSegments = coilTurns * 16
    
    const curve = new THREE.CatmullRomCurve3(
      Array(coilSegments + 1)
        .fill(0)
        .map((_, i) => {
          const t = i / coilSegments
          const angle = t * Math.PI * 2 * coilTurns
          const x = coilRadius * Math.cos(angle)
          const z = coilRadius * Math.sin(angle)
          const y = -0.5 + t * coilHeight
          return new THREE.Vector3(x, y, z)
        })
    )
    
    const tubeGeometry = new THREE.TubeGeometry(curve, coilSegments, 0.02, 8, false)
    const coil = new THREE.Mesh(tubeGeometry, material)
    scene.add(coil)
    
    // Feed point indicator
    const feedGeometry = new THREE.SphereGeometry(0.05, 16, 16)
    const feedMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    const feedPoint = new THREE.Mesh(feedGeometry, feedMaterial)
    feedPoint.position.set(0, -0.5, 0)
    scene.add(feedPoint)
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Rotate: click and drag. Zoom: scroll. Pan: right-click and drag.
        </AlertDescription>
      </Alert>
      <div ref={containerRef} className="w-full h-[400px] rounded-md overflow-hidden" />
    </div>
  )
}
