import { getRequestUrl } from '../../utils'

const request = async (path, params) => {
  const res = await fetch(getRequestUrl(process.env.NEXT_PUBLIC_INDEXER_URL, path, { ...params }))
  return await res.json()
}

const objectToString = object => object ? typeof object === 'object' ? JSON.stringify(object) : object : undefined

export const dayMetrics = async params => {
  const path = '/day_metrics/_search'

  params = {
    size: 0,
    ...params,
    index: 'day_metrics',
    method: 'search',
    aggs: objectToString(params.aggs),
    query: objectToString(params.query),
    sort: objectToString(params.sort),
  }

  let response = await request(path, params)

  if (response && response.aggregations && response.aggregations.chains && response.aggregations.chains.buckets) {
    response = {
      data: Object.fromEntries(response.aggregations.chains.buckets.map(chain => {
        const records = chain?.day_metrics?.buckets?.map(day => {
          return {
            id: `${chain?.key}-${day?.key}`,
            dayStartTimestamp: day?.key,
            _normalize_volume: day?.volumes?.value,
            txCount: day?.txs?.value,
            data: {},
          }
        })

        return [chain?.key, records]
      })),
      total: response.hits && response.hits.total && response.hits.total.value,
    }
  }

  return response
}