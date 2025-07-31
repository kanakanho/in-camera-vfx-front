import { useAtomValue } from 'jotai'
import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import { threeJSMatrixAtom } from './atom/MatrixAtom'
import { zCameraControlSchema, zMatrix4x4, zSendMessage } from './type'

// const WS_URL = 'ws://192.168.101.39:3099/wss'
const WS_URL = import.meta.env.VITE_WEBSOCKET_URL

const ThreeCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const threeState = useRef<{
    scene?: THREE.Scene
    camera?: THREE.PerspectiveCamera
    renderer?: THREE.WebGLRenderer
  }>({})

  const threeJSMatrix = useAtomValue(threeJSMatrixAtom)

  useEffect(() => {
    // 初期化
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0.1, 0, 0)
    scene.add(camera)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(new THREE.Color(0x000000))

    // OrbitControls
    // new OrbitControls(camera, renderer.domElement)

    // canvasを追加
    const canvasEl = canvasRef.current
    if (canvasEl) {
      canvasEl.innerHTML = ''
      canvasEl.appendChild(renderer.domElement)
    }
    else {
      document.body.appendChild(renderer.domElement)
    }

    // リサイズ対応
    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // threeWorld
    initSky(scene)
    addBalls(scene, camera)
    setLight(scene)

    // レンダリング
    function animate() {
      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }
    animate()

    // 保存
    threeState.current = { scene, camera, renderer }

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      if (canvasEl)
        canvasEl.innerHTML = ''
    }
  }, [])

  // WebSocket
  useEffect(() => {
    const socket = new WebSocket(WS_URL)
    function handleMessage(event: MessageEvent) {
      let parsed
      try {
        parsed = JSON.parse(event.data)
      }
      catch (e) {
        console.error('WebSocket message parse error:', e)
        return
      }
      const message = zSendMessage.safeParse(parsed)
      if (!message.success)
        return
      if (message.data.type !== 'message')
        return
      let cameraData = message.data.data
      if (typeof cameraData === 'string') {
        try {
          cameraData = JSON.parse(cameraData)
        }
        catch (e) {
          console.error('Invalid camera control data format (parse error)', e)
          return
        }
      }
      const { camera } = threeState.current
      if (!camera)
        return
      // マトリックス
      const matrix4x4 = zMatrix4x4.safeParse(cameraData)
      if (matrix4x4.success) {
        const matrix = new THREE.Matrix4().fromArray(matrix4x4.data.flat())
        const moveMatrix = new THREE.Matrix4().multiplyMatrices(matrix, threeJSMatrix)
        camera.matrix.copy(moveMatrix)
        camera.matrix.decompose(camera.position, camera.quaternion, camera.scale)
        camera.updateProjectionMatrix()
      }
      // 位置と回転
      const cameraControlSchema = zCameraControlSchema.safeParse(cameraData)
      if (cameraControlSchema.success) {
        // matrix を作成
        const position = cameraControlSchema.data.position
        const rotation = cameraControlSchema.data.rotation
        const m = new THREE.Matrix4()
        m.makeTranslation(position.x, position.y, position.z)
        const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(
          rotation.x,
          rotation.y,
          rotation.z,
        ))
        m.makeRotationFromQuaternion(quat)
        m.scale(new THREE.Vector3(1, 1, 1)) // スケールは1のまま
        // threeJSMatrixAtomを更新
        const moveMatrix = new THREE.Matrix4().multiplyMatrices(m, threeJSMatrix)
        camera.matrix.copy(moveMatrix)
        camera.matrix.decompose(camera.position, camera.quaternion, camera.scale)
        camera.updateProjectionMatrix()
      }
    }
    socket.addEventListener('message', handleMessage)
    return () => {
      socket.removeEventListener('message', handleMessage)
      socket.close()
    }
  }, [threeJSMatrix])

  return <div ref={canvasRef} id="canvas" style={{ width: '100vw', height: '100vh' }} />
}

function setLight(scene: THREE.Scene) {
  const ambientLight = new THREE.AmbientLight(0xFFFFFF)
  scene.add(ambientLight)
}

function initSky(scene: THREE.Scene) {
  const sky = new Sky()
  sky.scale.setScalar(450000)
  scene.add(sky)
  const sky_uniforms: any = (sky.material as any).uniforms || (sky.material as any).getUniforms?.()
  if (!sky_uniforms)
    return
  if (sky_uniforms.turbidity)
    sky_uniforms.turbidity.value = 10
  if (sky_uniforms.rayleigh)
    sky_uniforms.rayleigh.value = 2
  if (sky_uniforms.luminance)
    sky_uniforms.luminance.value = 1
  if (sky_uniforms.mieCoefficient)
    sky_uniforms.mieCoefficient.value = 0.005
  if (sky_uniforms.mieDirectionalG)
    sky_uniforms.mieDirectionalG.value = 0.8
  const sunSphere = new THREE.Mesh(
    new THREE.SphereGeometry(200, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0xFFFFFF }),
  )
  scene.add(sunSphere)
  const theta = Math.PI * -0.01
  const phi = 2 * Math.PI * -0.25
  const distance = 400000
  sunSphere.position.x = distance * Math.cos(phi)
  sunSphere.position.y = distance * Math.sin(phi) * Math.sin(theta)
  sunSphere.position.z = distance * Math.sin(phi) * Math.cos(theta)
  sunSphere.visible = true
  if (sky_uniforms.sunPosition && sky_uniforms.sunPosition.value) {
    sky_uniforms.sunPosition.value.copy(sunSphere.position)
  }
}

function addBalls(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const cameraPosition = camera.position.clone()
  const radius = 1
  const numBalls = 10
  for (let i = 0; i < numBalls; i++) {
    const angle = (i / numBalls) * Math.PI * 2
    const x = cameraPosition.x + radius * Math.cos(angle)
    const y = cameraPosition.y + radius * Math.sin(angle)
    const z = cameraPosition.z
    const position = new THREE.Vector3(x, y, z)
    const color = Math.random() * 0xFFFFFF
    createBall(scene, position, color)
  }
  for (let i = 0; i < numBalls; i++) {
    const angle = (i / numBalls) * Math.PI * 2
    const x = cameraPosition.x + radius * Math.cos(angle)
    const y = cameraPosition.y + radius * Math.sin(angle)
    const z = cameraPosition.z + radius * Math.sin(angle + Math.PI)
    const position = new THREE.Vector3(x, y, z)
    const color = Math.random() * 0xFFFFFF
    createBall(scene, position, color)
  }
  for (let i = 0; i < numBalls; i++) {
    const angle = (i / numBalls) * Math.PI * 2
    const x = cameraPosition.x + radius * Math.cos(angle)
    const y = cameraPosition.y + radius * Math.sin(angle + Math.PI / 2)
    const z = cameraPosition.z + radius * Math.sin(angle)
    const position = new THREE.Vector3(x, y, z)
    const color = Math.random() * 0xFFFFFF
    createBall(scene, position, color)
  }
}

function createBall(scene: THREE.Scene, position: THREE.Vector3, color: number) {
  const geometry = new THREE.SphereGeometry(0.1, 32, 32)
  const material = new THREE.MeshBasicMaterial({ color })
  const ball = new THREE.Mesh(geometry, material)
  ball.position.copy(position)
  scene.add(ball)
}

export default ThreeCanvas
