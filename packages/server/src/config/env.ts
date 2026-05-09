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
  port: Number(process.env.PORT ?? 3001),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  amapWebKey: process.env.AMAP_WEB_KEY ?? '',
  amapWebSig: process.env.AMAP_WEB_SIG ?? '',
  tosEndpoint: process.env.TOS_ENDPOINT ?? '',
  tosRegion: process.env.TOS_REGION ?? 'cn-beijing',
  tosBucket: process.env.TOS_BUCKET ?? '',
  tosAccessKeyId: process.env.TOS_ACCESS_KEY_ID ?? '',
  tosSecretAccessKey: process.env.TOS_SECRET_ACCESS_KEY ?? '',
  aiBaseUrl: process.env.AI_BASE_URL ?? 'https://api.openai.com/v1',
  aiApiKey: process.env.AI_API_KEY ?? '',
  aiModel: process.env.AI_MODEL ?? 'gpt-4.1-mini',
  aiProvider: process.env.AI_PROVIDER ?? 'openai',
  doubaoBaseUrl: process.env.DOUBAO_BASE_URL ?? 'https://ark.cn-beijing.volces.com/api/v3',
  doubaoApiKey: process.env.DOUBAO_API_KEY ?? '',
  doubaoModel: process.env.DOUBAO_MODEL ?? 'doubao-seed-1-6-250615',
  commuteConcurrency: Number(process.env.COMMUTE_CONCURRENCY ?? 3),
}
