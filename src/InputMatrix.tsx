import { useAtom } from 'jotai'
import { matrixAtom, matrixToTransformAtom, positionAtom, rotationAtom, scaleAtom, transformToMatrixAtom } from './atom/MatrixAtom'
import styles from './InputMatrix.module.css'

export default function InputMatrix() {
  const [position, setPosition] = useAtom(positionAtom)
  const [rotation, setRotation] = useAtom(rotationAtom)
  const [scale, setScale] = useAtom(scaleAtom)
  const [matrix, setMatrix] = useAtom(matrixAtom)
  const [, updateTransform] = useAtom(transformToMatrixAtom)
  const [, updateMatrix] = useAtom(matrixToTransformAtom)

  // 位置・回転・スケールの適用
  const handleApplyParam = () => {
    updateTransform({ position, rotation, scale })
  }

  // マトリックスの適用
  const handleApplyMatrix = () => {
    updateMatrix(matrix)
  }

  return (
    <div className={styles.menu}>
      <button type="button" className={styles.updateButton} popoverTarget="Modal">Matrixを更新</button>
      <div popover="" id="Modal" className={styles.modal}>
        <form method="dialog" className={styles.inputMatrix}>
          <h3>位置</h3>
          <div className={styles.matrixParam}>
            <input type="number" value={position.x} onChange={e => setPosition({ ...position, x: Number(e.target.value) })} placeholder="位置 X" />
            <input type="number" value={position.y} onChange={e => setPosition({ ...position, y: Number(e.target.value) })} placeholder="位置 Y" />
            <input type="number" value={position.z} onChange={e => setPosition({ ...position, z: Number(e.target.value) })} placeholder="位置 Z" />
          </div>
          <h3>回転</h3>
          <div className={styles.matrixParam}>
            <input type="number" value={rotation.x} onChange={e => setRotation({ ...rotation, x: Number(e.target.value) })} placeholder="回転 X" />
            <input type="number" value={rotation.y} onChange={e => setRotation({ ...rotation, y: Number(e.target.value) })} placeholder="回転 Y" />
            <input type="number" value={rotation.z} onChange={e => setRotation({ ...rotation, z: Number(e.target.value) })} placeholder="回転 Z" />
          </div>
          <h3>スケール</h3>
          <div className={styles.matrixParam}>
            <input type="number" value={scale.x} onChange={e => setScale({ ...scale, x: Number(e.target.value) })} placeholder="スケール X" />
            <input type="number" value={scale.y} onChange={e => setScale({ ...scale, y: Number(e.target.value) })} placeholder="スケール Y" />
            <input type="number" value={scale.z} onChange={e => setScale({ ...scale, z: Number(e.target.value) })} placeholder="スケール Z" />
          </div>
        </form>
        <button id="apply-param" className={styles.updateButton} type="button" onClick={handleApplyParam}>適用</button>
        <form method="dialog" className={styles.inputMatrix}>
          <h3>Matrixを更新</h3>
          <div className={styles.matrix}>
            {matrix.map((row, i) => (
              row.map((value, j) => {
                return (
                  <input
                    // eslint-disable-next-line react/no-array-index-key
                    key={`m${i}${j}`}
                    type="number"
                    value={value}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setMatrix((prev) => {
                        const next = prev.map(r => [...r])
                        next[i][j] = val
                        return next
                      })
                    }}
                    placeholder={`m${i}${j}`}
                  />
                )
              })
            ))}
          </div>
        </form>
        <button id="apply-matrix" className={styles.updateButton} type="button" onClick={handleApplyMatrix}>適用</button>
      </div>
    </div>
  )
}
