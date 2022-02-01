import { getRequestUrl } from '../../utils'

const _module = 'crosschain_config'

const request = async (path, params) => {
  const res = await fetch(getRequestUrl(process.env.NEXT_PUBLIC_API_URL, path, { ...params, module: _module }))
  return await res.json()
}

export const chains = async params => {
  params = { ...params, collection: `chains_${process.env.NEXT_PUBLIC_NETWORK}` }
  return await request(null, params)
}