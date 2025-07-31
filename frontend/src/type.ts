import z from 'zod'

export const zMatrix4x4 = z.array(z.array(z.number()).length(4)).length(4)

export const zCameraControlSchema = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  rotation: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
})

export type ZCameraControl = z.infer<typeof zCameraControlSchema>

export const zSendMessage = z.object({
  type: z.enum(['open', 'message', 'close', 'error']),
  data: z.union([z.string(), z.instanceof(ArrayBuffer), z.unknown()]),
})

export type ZSendMessage = z.infer<typeof zSendMessage>
