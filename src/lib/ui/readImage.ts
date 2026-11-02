// Images are embedded in the work file, so they're stored compactly: very
// large photos are scaled down, and photos are re-encoded as WebP (about a
// third smaller than JPEG at this quality, and visually the same at newspaper
// sizes). Images with transparency stay PNG, since a lossless WebP isn't
// guaranteed in every browser; SVGs and GIFs are kept as they are. If WebP
// isn't available (Safari) or comes out larger, the original is kept.
const MAX_SIDE_PX = 2400
const WEBP_QUALITY = 0.9

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function hasTransparency(context: CanvasRenderingContext2D, width: number, height: number): boolean {
  const data = context.getImageData(0, 0, width, height).data
  for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true
  return false
}

export async function readImage(file: File): Promise<string> {
  const dataUrl = await readAsDataUrl(file)
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return dataUrl
  const image = new Image()
  image.src = dataUrl
  await image.decode()
  const scale = Math.min(1, MAX_SIDE_PX / Math.max(image.naturalWidth, image.naturalHeight))

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.naturalWidth * scale)
  canvas.height = Math.round(image.naturalHeight * scale)
  const context = canvas.getContext('2d', { willReadFrequently: true })!
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  if (file.type === 'image/png' && hasTransparency(context, canvas.width, canvas.height)) {
    return scale < 1 ? canvas.toDataURL('image/png') : dataUrl
  }
  const webp = canvas.toDataURL('image/webp', WEBP_QUALITY)
  if (webp.startsWith('data:image/webp') && (scale < 1 || webp.length < dataUrl.length)) return webp
  // No WebP encoder: keep the original, or a good-quality JPEG if scaled down.
  if (scale >= 1) return dataUrl
  return file.type === 'image/png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.9)
}
