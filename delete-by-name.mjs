/**
 * delete-by-name.mjs
 * Elimina una campaña de Redis por nombre de archivo.
 * Uso: node delete-by-name.mjs "etapa_13062026200241.xlsx"
 */
import { Redis } from './node_modules/@upstash/redis/nodejs.mjs'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// Cargar .env.local
const __dirname = fileURLToPath(new URL('.', import.meta.url))
try {
  const env = readFileSync(resolve(__dirname, '.env.local'), 'utf-8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '')
  }
} catch {}

const FILENAME = process.argv[2]
if (!FILENAME) {
  console.error('Uso: node delete-by-name.mjs <filename>')
  process.exit(1)
}

const redis = new Redis({
  url:   process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

const index = await redis.get('campaigns:index') ?? []
const entry = index.find(c => c.filename === FILENAME)

if (!entry) {
  console.log('no-existe')
} else {
  await redis.del('campaign:' + entry.id)
  await redis.set('campaigns:index', index.filter(c => c.filename !== FILENAME))
  console.log('eliminada')
}
