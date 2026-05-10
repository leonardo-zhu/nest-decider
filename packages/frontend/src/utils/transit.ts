export async function queryTransitMinutes(params: {
  fromLng: number
  fromLat: number
  toLng: number
  toLat: number
  city: string
}): Promise<number> {
  const { fromLng, fromLat, toLng, toLat, city } = params
  if (!window.AMap) throw new Error('AMap not ready')

  return new Promise<number>((resolve, reject) => {
    const transfer = new window.AMap.Transfer({
      city,
      policy: 0,
      nightflag: 0,
      hideMarkers: true,
    })
    const origin = new window.AMap.LngLat(fromLng, fromLat)
    const destination = new window.AMap.LngLat(toLng, toLat)
    transfer.search(origin, destination, (status, result) => {
      if (status !== 'complete' || !result.plans) {
        reject(new Error('no route'))
        return
      }
      const plans = result.plans as Array<Record<string, unknown>>
      const first = plans[0]
      if (!first || typeof first.time !== 'number') {
        reject(new Error('no route'))
        return
      }
      resolve(Math.ceil(first.time / 60))
    })
  })
}
