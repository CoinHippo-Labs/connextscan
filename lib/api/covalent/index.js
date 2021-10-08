import _ from 'lodash'

import { getRequestUrl } from '../../utils'

const api_name = 'covalent'

const CURRENCY = 'usd'

const request = async (path, params) => {
  const res = await fetch(getRequestUrl(process.env.NEXT_PUBLIC_API_URL, path, { ...params, api_name }))
  return await res.json()
}

export const contracts = async (chain_id, contract_addresses, params) => {
  const path = `/pricing/historical_by_addresses_v2/${chain_id}/${CURRENCY}/${contract_addresses}/`

  let response = await request(path, params)

  response = { ...response, data: response?.data?.map(contract => { return contract && { ...contract, logo_url: _.uniq(_.concat(contract.logo_url, contract.prices?.map(price => price?.contract_metadata?.logo_url))) } }) }

  return response
}