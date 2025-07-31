import { atom } from 'jotai'
import * as THREE from 'three'

// 初期値
const defaultPosition = { x: 0, y: 0, z: 0 }
const defaultRotation = { x: 0, y: 0, z: 0 }
const defaultScale = { x: 1, y: 1, z: 1 }
const defaultMatrix = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
]
const threeJSMatrix = new THREE.Matrix4().fromArray(defaultMatrix.flat())

// 基本Atom
export const positionAtom = atom(defaultPosition)
export const rotationAtom = atom(defaultRotation)
export const scaleAtom = atom(defaultScale)
export const matrixAtom = atom(defaultMatrix)
export const threeJSMatrixAtom = atom(threeJSMatrix)

// matrixが変更されたらposition,rotation,scaleを逐次更新
export const matrixToTransformAtom = atom(
  get => get(matrixAtom),
  (get, set, newMatrix: number[][]) => {
    set(matrixAtom, newMatrix)
    const m = new THREE.Matrix4().fromArray(newMatrix.flat())
    const pos = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scl = new THREE.Vector3()
    m.decompose(pos, quat, scl)
    const rot = new THREE.Euler().setFromQuaternion(quat)
    // 弧度法→度数法
    set(positionAtom, { x: pos.x, y: pos.y, z: pos.z })
    set(rotationAtom, {
      x: (rot.x * 180) / Math.PI,
      y: (rot.y * 180) / Math.PI,
      z: (rot.z * 180) / Math.PI,
    })
    set(scaleAtom, { x: scl.x, y: scl.y, z: scl.z })
    set(threeJSMatrixAtom, m.clone())
  },
)

// position,rotation,scaleが変更されたらmatrixを逐次更新
export const transformToMatrixAtom = atom(
  get => ({
    position: get(positionAtom),
    rotation: get(rotationAtom),
    scale: get(scaleAtom),
  }),
  (get, set, { position, rotation, scale }: {
    position: { x: number, y: number, z: number }
    rotation: { x: number, y: number, z: number }
    scale: { x: number, y: number, z: number }
  }) => {
    set(positionAtom, position)
    set(rotationAtom, rotation)
    set(scaleAtom, scale)
    const m = new THREE.Matrix4()
    // 度数法→弧度法
    m.compose(
      new THREE.Vector3(position.x, position.y, position.z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(
        (rotation.x * Math.PI) / 180,
        (rotation.y * Math.PI) / 180,
        (rotation.z * Math.PI) / 180,
      )),
      new THREE.Vector3(scale.x, scale.y, scale.z),
    )
    // 4x4配列に変換
    const arr = m.toArray()
    const matrix = [
      arr.slice(0, 4),
      arr.slice(4, 8),
      arr.slice(8, 12),
      arr.slice(12, 16),
    ]
    set(matrixAtom, matrix)
    set(threeJSMatrixAtom, m.clone())
  },
)
