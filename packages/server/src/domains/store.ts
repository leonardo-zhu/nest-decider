import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Property, Settings, Target } from './types.js'
import { env } from '../config/env.js'

const dataDir = env.dataDir
  ? path.resolve(env.dataDir)
  : path.resolve(process.cwd(), 'data')

async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
  const fullPath = path.join(dataDir, fileName)
  try {
    const raw = await fs.readFile(fullPath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function writeJsonFile<T>(fileName: string, data: T): Promise<void> {
  const fullPath = path.join(dataDir, fileName)
  await fs.mkdir(dataDir, { recursive: true })
  await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8')
}

export const store = {
  readProperties: () => readJsonFile<Property[]>('properties.json', []),
  writeProperties: (rows: Property[]) => writeJsonFile('properties.json', rows),
  readTargets: () => readJsonFile<Target[]>('targets.json', []),
  writeTargets: (rows: Target[]) => writeJsonFile('targets.json', rows),
  readSettings: () => readJsonFile<Settings>('settings.json', { activeTargetId: null }),
  writeSettings: (row: Settings) => writeJsonFile('settings.json', row),
}
