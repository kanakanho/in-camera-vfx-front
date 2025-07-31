import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import { zCameraControlSchema, zMatrix4x4, zSendMessage } from './type'

// DOMContentLoaded後に初期化
window.addEventListener('DOMContentLoaded', () => {
  init()
})

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
// let orbitControls: OrbitControls;

let cameraMatrix: THREE.Matrix4

function init() {
  // シーン、カメラ、レンダラーを生成
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(0.1, 0, 0)
  scene.add(camera)
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(new THREE.Color(0x000000))

  // OrbitControls
  document.addEventListener(
    'touchmove',
    (e) => {
      e.preventDefault()
    },
    { passive: false },
  )

  new OrbitControls(camera, renderer.domElement)

  // canvasを作成
  const container = document.getElementById('canvas')
  if (container) {
    container.appendChild(renderer.domElement)
  }
  else {
    document.body.appendChild(renderer.domElement)
  }

  // ウィンドウのリサイズに対応
  window.addEventListener(
    'resize',
    () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    },
    false,
  )

  threeWorld()
  setLight()
  rendering()
}

function threeWorld() {
  // //座標軸の生成
  // const axes = new THREE.AxesHelper(1000);
  // axes.position.set(0, 0, 0);
  // scene.add(axes);

  // //グリッドの生成
  // const grid = new THREE.GridHelper(100, 100);
  // scene.add(grid);

  // Skyの初期化
  initSky()

  // ボールを配置
  // カメラの位置から同心円上にランダムな色でボールを配置
  const cameraPosition = camera.position.clone()
  const radius = 1 // 半径1の円上に配置
  const numBalls = 10 // 配置するボールの数
  for (let i = 0; i < numBalls; i++) {
    const angle = (i / numBalls) * Math.PI * 2 // 円周上の角度
    const x = cameraPosition.x + radius * Math.cos(angle)
    const y = cameraPosition.y + radius * Math.sin(angle)
    const z = cameraPosition.z
    const position = new THREE.Vector3(x, y, z)

    // ランダムな色を生成
    const color = Math.random() * 0xFFFFFF

    // ボールを配置
    createBall(position, color)
  }
  for (let i = 0; i < numBalls; i++) {
    const angle = (i / numBalls) * Math.PI * 2 // 円周上の角度
    const x = cameraPosition.x + radius * Math.cos(angle)
    const y = cameraPosition.y + radius * Math.sin(angle)
    const z = cameraPosition.z + radius * Math.sin(angle + Math.PI)
    const position = new THREE.Vector3(x, y, z)

    // ランダムな色を生成
    const color = Math.random() * 0xFFFFFF

    // ボールを配置
    createBall(position, color)
  }
  for (let i = 0; i < numBalls; i++) {
    const angle = (i / numBalls) * Math.PI * 2 // 円周上の角度
    const x = cameraPosition.x + radius * Math.cos(angle)
    const y = cameraPosition.y + radius * Math.sin(angle + Math.PI / 2)
    const z = cameraPosition.z + radius * Math.sin(angle)
    const position = new THREE.Vector3(x, y, z)

    // ランダムな色を生成
    const color = Math.random() * 0xFFFFFF

    // ボールを配置
    createBall(position, color)
  }
}

function setLight() {
  // 環境光
  const ambientLight = new THREE.AmbientLight(0xFFFFFF)
  scene.add(ambientLight)
}

function rendering() {
  requestAnimationFrame(rendering)
  renderer.render(scene, camera)
}

function initSky() {
  // Sky
  const sky = new Sky()
  sky.scale.setScalar(450000)
  scene.add(sky)

  // Skyの設定
  // Sky.jsのmaterial.uniformsはmaterial["uniforms"]でアクセスできない場合があるため、material["uniforms"]が存在するかチェック
  // three.js r150以降はmaterial.uniformsが廃止され、material.uniformsDataやmaterial.getUniforms()などになる場合がある
  // ここでは互換性のために型チェックを行う
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

  // Sun
  const sunSphere = new THREE.Mesh(
    new THREE.SphereGeometry(200, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0xFFFFFF }),
  )
  scene.add(sunSphere)

  // Sunの設定
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

// 適当にボールを配置する
function createBall(position: THREE.Vector3, color: number) {
  const geometry = new THREE.SphereGeometry(0.1, 32, 32)
  const material = new THREE.MeshBasicMaterial({ color })
  const ball = new THREE.Mesh(geometry, material)
  ball.position.copy(position)
  scene.add(ball)
}

// websocket Client の初期化
const socket = new WebSocket('ws://192.168.101.39:3099/wss')
socket.addEventListener('open', () => {
  console.log('WebSocket connection opened')
})
socket.addEventListener('message', (event) => {
  let parsed
  try {
    parsed = JSON.parse(event.data)
  }
  catch (e) {
    // プレーンテキスト等、JSONでない場合は無視
    return
  }
  // ZSendMessage でパース
  const message = zSendMessage.safeParse(parsed)
  if (message.success) {
    switch (message.data.type) {
      case 'open':
        console.log('WebSocket connection opened by server')
        break
      case 'message': {
        // console.log("Received message:", message.data.data);
        let cameraData = message.data.data
        // もしstringならJSON.parse
        if (typeof cameraData === 'string') {
          try {
            cameraData = JSON.parse(cameraData)
          }
          catch (e) {
            console.error('Invalid camera control data format (parse error)')
            break
          }
        }

        // カメラの位置と回転を更新
        const cameraControlSchema = zCameraControlSchema.safeParse(cameraData)
        if (cameraControlSchema.success) {
          camera.position.set(
            cameraControlSchema.data.position.x,
            cameraControlSchema.data.position.y,
            cameraControlSchema.data.position.z,
          )
          camera.rotation.set(
            cameraControlSchema.data.rotation.x,
            cameraControlSchema.data.rotation.y,
            cameraControlSchema.data.rotation.z,
          )
          break
        }
        else {
          console.error('Invalid camera control data format')
        }

        // マトリックスの更新
        const matrix4x4 = zMatrix4x4.safeParse(cameraData)
        if (matrix4x4.success) {
          const matrix = new THREE.Matrix4().fromArray(matrix4x4.data.flat())
          const moveMatrix = new THREE.Matrix4().multiplyMatrices(matrix, camera.matrix)
          camera.matrix.copy(moveMatrix)
          camera.matrix.decompose(camera.position, camera.quaternion, camera.scale)
          camera.updateProjectionMatrix()
          break
        }
        else {
          console.error('Invalid camera control data format (matrix4x4)')
        }
        break
      }
      case 'close':
        console.log('WebSocket connection closed by server')
        break
      case 'error':
        console.error('WebSocket error:', message.data.data)
        break
    }
  }
  else {
    console.error('Failed to parse WebSocket message:', message.error)
  }
})
socket.addEventListener('error', (event) => {
  console.error('WebSocket error:', event)
})
socket.addEventListener('close', () => {
  console.log('WebSocket connection closed')
})
