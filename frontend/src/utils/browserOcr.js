import { createWorker, OEM } from 'tesseract.js'

function enhanceImage(file) {
  return createImageBitmap(file).then(bitmap => {
    const maxDimension = 2400
    const scale = Math.min(2.5, maxDimension / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('This browser cannot prepare the image for OCR.')
    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const image = context.getImageData(0, 0, width, height)
    const histogram = new Uint32Array(256)
    for (let i = 0; i < image.data.length; i += 4) {
      const gray = Math.max(0, Math.min(255, Math.round(
        (0.299 * image.data[i] + 0.587 * image.data[i + 1] + 0.114 * image.data[i + 2] - 128) * 1.35 + 128,
      )))
      image.data[i] = gray
      image.data[i + 1] = gray
      image.data[i + 2] = gray
      histogram[gray] += 1
    }
    const total = width * height
    let weighted = 0
    for (let i = 0; i < 256; i += 1) weighted += i * histogram[i]
    let backgroundWeight = 0
    let backgroundSum = 0
    let maxVariance = 0
    let threshold = 160
    for (let i = 0; i < 256; i += 1) {
      backgroundWeight += histogram[i]
      if (backgroundWeight === 0) continue
      const foregroundWeight = total - backgroundWeight
      if (foregroundWeight === 0) break
      backgroundSum += i * histogram[i]
      const meanBackground = backgroundSum / backgroundWeight
      const meanForeground = (weighted - backgroundSum) / foregroundWeight
      const variance = backgroundWeight * foregroundWeight * (meanBackground - meanForeground) ** 2
      if (variance > maxVariance) {
        maxVariance = variance
        threshold = i
      }
    }
    for (let i = 0; i < image.data.length; i += 4) {
      const value = image.data[i] > threshold ? 255 : 0
      image.data[i] = value
      image.data[i + 1] = value
      image.data[i + 2] = value
    }
    context.putImageData(image, 0, 0)
    return canvas
  })
}

export async function recognizeLabel(file, onProgress = () => {}) {
  const image = await enhanceImage(file)
  const base = import.meta.env.BASE_URL
  let worker
  try {
    worker = await createWorker('eng+hin+mar', OEM.LSTM_ONLY, {
      workerPath: `${base}ocr/worker.min.js`,
      langPath: `${base}ocr/tessdata`,
      corePath: `${base}ocr/core`,
      gzip: true,
      logger: message => onProgress({
        progress: message.progress || 0,
        status: message.status || 'Preparing OCR…',
      }),
    })
    const { data } = await worker.recognize(image)
    return {
      text: data.text.trim(),
      confidence: Math.max(0, Math.min(1, (data.confidence || 0) / 100)),
    }
  } finally {
    if (worker) await worker.terminate()
  }
}
