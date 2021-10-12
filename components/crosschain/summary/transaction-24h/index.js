import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'

import { numberFormat } from '../../../../lib/utils'

export default function Transaction24h({ className = '' }) {
  const { contracts, assets, last24h } = useSelector(state => ({ contracts: state.contracts, assets: state.assets, last24h: state.last24h }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }
  const { last_24h_data } = { ...last24h }

  const [last24hData, setLast24hData] = useState(null)

  useEffect(() => {
    if (last_24h_data && assets_data && contracts_data) {
      const data = last_24h_data.map(_last_24h => {
        return {
          ..._last_24h,
          data: contracts_data?.find(contract => contract.id === _last_24h?.assetId)?.data,
          chain_data: Object.values(assets_data)?.flatMap(assets => assets).find(asset => asset.contract_address === _last_24h?.assetId)?.chain_data,
        }
      })

      setLast24hData({ data, volume: _.sumBy(data, 'txCount') })
    }
  }, [contracts_data, assets_data, last_24h_data])

  return (
    <div className="max-h-full flex flex-col py-4">
      {last24hData?.data?.findIndex(asset => !(asset?.data)) < 0 ?
        <div className="text-2xl sm:text-xl lg:text-2xl font-semibold">
          {numberFormat(last24hData.transaction, '0,0')}
        </div>
        :
        <div className="skeleton w-40 h-8" />
      }
    </div>
  )
}