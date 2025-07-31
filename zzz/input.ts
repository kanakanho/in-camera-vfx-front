import * as THREE from 'three'
import { camera } from './main'

const inputMatrix00 = document.getElementById('matrix00') as HTMLInputElement
const inputMatrix01 = document.getElementById('matrix01') as HTMLInputElement
const inputMatrix02 = document.getElementById('matrix02') as HTMLInputElement
const inputMatrix03 = document.getElementById('matrix03') as HTMLInputElement
const inputMatrix10 = document.getElementById('matrix10') as HTMLInputElement
const inputMatrix11 = document.getElementById('matrix11') as HTMLInputElement
const inputMatrix12 = document.getElementById('matrix12') as HTMLInputElement
const inputMatrix13 = document.getElementById('matrix13') as HTMLInputElement
const inputMatrix20 = document.getElementById('matrix20') as HTMLInputElement
const inputMatrix21 = document.getElementById('matrix21') as HTMLInputElement
const inputMatrix22 = document.getElementById('matrix22') as HTMLInputElement
const inputMatrix23 = document.getElementById('matrix23') as HTMLInputElement
const inputMatrix30 = document.getElementById('matrix30') as HTMLInputElement
const inputMatrix31 = document.getElementById('matrix31') as HTMLInputElement
const inputMatrix32 = document.getElementById('matrix32') as HTMLInputElement
const inputMatrix33 = document.getElementById('matrix33') as HTMLInputElement

let inputs = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

let positionX = 0.1
let positionY = 0
let positionZ = 0

let rotationX = 0
let rotationY = 0
let rotationZ = 0

let scaleX = 1
let scaleY = 1
let scaleZ = 1

function updateMatrixInputs(matrix: THREE.Matrix4) {
  inputs = [
    matrix.elements[0],
    matrix.elements[1],
    matrix.elements[2],
    matrix.elements[3],
    matrix.elements[4],
    matrix.elements[5],
    matrix.elements[6],
    matrix.elements[7],
    matrix.elements[8],
    matrix.elements[9],
    matrix.elements[10],
    matrix.elements[11],
    matrix.elements[12],
    matrix.elements[13],
    matrix.elements[14],
    matrix.elements[15],
  ]

  inputMatrix00.value = matrix.elements[0].toString()
  inputMatrix01.value = matrix.elements[1].toString()
  inputMatrix02.value = matrix.elements[2].toString()
  inputMatrix03.value = matrix.elements[3].toString()
  inputMatrix10.value = matrix.elements[4].toString()
  inputMatrix11.value = matrix.elements[5].toString()
  inputMatrix12.value = matrix.elements[6].toString()
  inputMatrix13.value = matrix.elements[7].toString()
  inputMatrix20.value = matrix.elements[8].toString()
  inputMatrix21.value = matrix.elements[9].toString()
  inputMatrix22.value = matrix.elements[10].toString()
  inputMatrix23.value = matrix.elements[11].toString()
  inputMatrix30.value = matrix.elements[12].toString()
  inputMatrix31.value = matrix.elements[13].toString()
  inputMatrix32.value = matrix.elements[14].toString()
  inputMatrix33.value = matrix.elements[15].toString()

  positionX = matrix.elements[12]
  positionY = matrix.elements[13]
  positionZ = matrix.elements[14]

  rotationX = Math.atan2(matrix.elements[9], matrix.elements[10])
  rotationY = Math.atan2(-matrix.elements[8], Math.sqrt(matrix.elements[9] ** 2 + matrix.elements[10] ** 2))
  rotationZ = Math.atan2(matrix.elements[4], matrix.elements[0])

  scaleX = Math.sqrt(matrix.elements[0] ** 2 + matrix.elements[1] ** 2 + matrix.elements[2] ** 2)
  scaleY = Math.sqrt(matrix.elements[4] ** 2 + matrix.elements[5] ** 2 + matrix.elements[6] ** 2)
  scaleZ = Math.sqrt(matrix.elements[8] ** 2 + matrix.elements[9] ** 2 + matrix.elements[10] ** 2)
}

function updateMatrixInputs({ x, y, z, oldMatrix }: { x: number, y: number, z: number, oldMatrix: THREE.Matrix4 }) {
  positionX = x
  positionY = y
  positionZ = z

  const newMatrix = new THREE.Matrix4().multiplyMatrices(
    oldMatrix,
    new THREE.Matrix4().setPosition(new THREE.Vector3(x, y, z)),
  )

  camera.matrix.copy(newMatrix)
  camera.matrix.decompose(camera.position, camera.quaternion, camera.scale)
  camera.updateProjectionMatrix()

  inputs = [
    camera.matrix.elements[0],
    camera.matrix.elements[1],
    camera.matrix.elements[2],
    camera.matrix.elements[3],
    camera.matrix.elements[4],
    camera.matrix.elements[5],
    camera.matrix.elements[6],
    camera.matrix.elements[7],
    camera.matrix.elements[8],
    camera.matrix.elements[9],
    camera.matrix.elements[10],
    camera.matrix.elements[11],
    camera.matrix.elements[12],
    camera.matrix.elements[13],
    camera.matrix.elements[14],
    camera.matrix.elements[15],
  ]

  rotationX = camera.rotation.x
  rotationY = camera.rotation.y
  rotationZ = camera.rotation.z

  scaleX = camera.scale.x
  scaleY = camera.scale.y
  scaleZ = camera.scale.z
}
