import { getRequestUrl } from '../../utils'

const api_name = 'coingecko'

const request = async (path, params) => {
  const res = await fetch(getRequestUrl(process.env.NEXT_PUBLIC_API_URL, path, { ...params, api_name }))
  return await res.json()
}

export const coinsMarkets = async params => {
  const path = '/coins/markets'
  return await request(path, params)
}

export const coin = async (id, params) => {
  const path = `/coins/${id}`
  return await request(path, params)
}