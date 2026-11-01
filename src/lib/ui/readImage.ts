// Images are embedded in the work file, so very large photos are scaled down
// on import to keep files (and autosave) a reasonable size.
const MAX_SIDE_PX = 2400

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function readImage(file: File): Promise<string> {
  const dataUrl = await readAsDataUrl(file)
  const image = new Image()
  image.src = dataUrl
  await image.decode()
  const scale = MAX_SIDE_PX / Math.max(image.naturalWidth, image.naturalHeight)
  if (scale >= 1 || file.type === 'image/svg+xml' || file.type === 'image/gif') return dataUrl

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.naturalWidth * scale)
  canvas.height = Math.round(image.naturalHeight * scale)
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
  // PNGs may have transparency; everything else becomes a good-quality JPEG.
  return file.type === 'image/png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.9)
}
