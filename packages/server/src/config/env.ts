import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'

const root = path.resolve(process.cwd(), '..', '..')
const nodeEnv = process.env.NODE_ENV ?? 'development'

const envCandidates = [
  '.env',
  '.env.local',
  `.env.${nodeEnv}`,
  `.env.${nodeEnv}.local`,
]

for (const fileName of envCandidates) {
  const fullPath = path.join(root, fileName)
  if (!fs.existsSync(fullPath)) continue

  const parsed = dotenv.config({ path: fullPath, override: false })
  dotenvExpand.expand(parsed)
}

export const env = {
  port: Number(process.env.PORT ?? 8787),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  dataDir: process.env.DATA_DIR ?? '',
}
