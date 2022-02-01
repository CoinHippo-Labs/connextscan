import { getRequestUrl } from '../../utils'

const _module = 'tokens'

const request = async (path, params) => {
  const res = await fetch(getRequestUrl(process.env.NEXT_PUBLIC_API_URL, path, { ...params, module: _module }))
  return await res.json()
}

export const tokens = async params => await request(null, params)