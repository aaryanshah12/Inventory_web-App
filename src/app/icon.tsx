import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
  const imgBuffer = readFileSync(path.join(process.cwd(), 'public/image.png'))
  const base64 = `data:image/png;base64,${imgBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'white',
        }}
      >
        <img
          src={base64}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    ),
    { width: 64, height: 64 }
  )
}
