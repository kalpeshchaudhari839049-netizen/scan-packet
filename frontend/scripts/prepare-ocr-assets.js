import { copyFile, mkdir, readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const frontendDirectory = path.resolve(scriptDirectory, '..')
const publicDirectory = path.join(frontendDirectory, 'public', 'ocr')
const coreDirectory = path.join(publicDirectory, 'core')
const languageDirectory = path.join(publicDirectory, 'tessdata')
const nodeModules = path.join(frontendDirectory, 'node_modules')

await rm(publicDirectory, { recursive: true, force: true })
await mkdir(coreDirectory, { recursive: true })
await mkdir(languageDirectory, { recursive: true })

const workerPath = path.join(nodeModules, 'tesseract.js', 'dist', 'worker.min.js')
await copyFile(workerPath, path.join(publicDirectory, 'worker.min.js'))

const coreSource = path.join(nodeModules, 'tesseract.js-core')
const coreFiles = await readdir(coreSource)
for (const name of coreFiles) {
  if (/^tesseract-core-(?:relaxedsimd-|simd-)?lstm(?:\.wasm)?(?:\.js)?$/.test(name)) {
    await copyFile(path.join(coreSource, name), path.join(coreDirectory, name))
  }
}

for (const language of ['eng', 'hin', 'mar']) {
  const source = path.join(nodeModules, '@tesseract.js-data', language, '4.0.0_best_int', `${language}.traineddata.gz`)
  await copyFile(source, path.join(languageDirectory, `${language}.traineddata.gz`))
}

console.log('Prepared local Tesseract worker, core, and eng/hin/mar language data.')
