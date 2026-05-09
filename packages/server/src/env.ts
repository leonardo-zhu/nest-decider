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
}
