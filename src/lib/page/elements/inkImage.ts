// Renders an image as if printed in one ink on the paper: every pixel takes
// the ink colour, with its opacity set by how dark the pixel was, so the light
// parts let the paper show through. Done in a canvas rather than a CSS/SVG
// filter so exports come out the same as the screen.

const MAX_CACHED = 24
// Insertion-ordered, so the first key is the oldest.
const cache = new Map<string, Promise<string>>()

function parseHex(color: string): [number, number, number] {
  const hex = color.replace('#', '')
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex
  const n = parseInt(full.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = src
  })
}

async function render(src: string, ink: string): Promise<string> {
  const img = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const context = canvas.getContext('2d')!
  context.drawImage(img, 0, 0)
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
  const data = pixels.data
  const [r, g, b] = parseHex(ink)
  for (let i = 0; i < data.length; i += 4) {
    const luminance = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255
    data[i + 3] = Math.round((1 - luminance) * data[i + 3])
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }
  context.putImageData(pixels, 0, 0)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not render image')
  return URL.createObjectURL(blob)
}

// A (blob) URL for the ink version of an image, cached per image and ink.
export function inkImage(key: string, src: string, ink: string): Promise<string> {
  const id = `${key}|${ink}`
  let result = cache.get(id)
  if (!result) {
    result = render(src, ink)
    cache.set(id, result)
    result.catch(() => cache.delete(id))
    while (cache.size > MAX_CACHED) {
      const [oldest, url] = cache.entries().next().value!
      cache.delete(oldest)
      url.then(URL.revokeObjectURL, () => {})
    }
  }
  return result
}
