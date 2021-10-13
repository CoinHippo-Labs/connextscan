import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'

import { graphql } from '../../../../lib/api/subgraph'
import { currency_symbol } from '../../../../lib/object/currency'
import { numberFormat } from '../../../../lib/utils'

import { LAST_24H_DATA } from '../../../../reducers/types'

export default function Volume24h({ className = '' }) {
  const dispatch = useDispatch()
  const { contracts, assets, last24h } = useSelector(state => ({ contracts: state.contracts, assets: state.assets, last24h: state.last24h }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }
  const { last_24h_data } = { ...last24h }

  const [last24hData, setLast24hData] = useState(null)

  useEffect(() => {
    const getData = async () => {
      if (assets_data) {
        const assets = Object.values(assets_data).flatMap(asset_data => asset_data)

        if (assets.findIndex(asset => !(asset?.data)) < 0) {
          let _last24hData

          for (let i = 0; i < assets.length; i++) {
            const asset = assets[i]

            if (asset?.data?.contract_address) {
              // const response = await assetBalances({ chain_id: network.id })

              
            }
          }

          if (_last24hData) {
            dispatch({
              type: LAST_24H_DATA,
              value: _last24hData,
            })
          }
        }
      }
    }

    getData()

    const interval = setInterval(() => getData(), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [contracts_data, assets_data])

  useEffect(() => {
    if (last_24h_data && assets_data && contracts_data) {
      const data = last_24h_data.map(_last_24h => {
        return {
          ..._last_24h,
          data: contracts_data?.find(contract => contract.id === _last_24h?.assetId)?.data,
          chain_data: Object.values(assets_data)?.flatMap(assets => assets).find(asset => asset.contract_address === _last_24h?.assetId)?.chain_data,
        }
      }).map(_last_24h => {
        return {
          ..._last_24h,
          normalize_volume: _last_24h?.data?.contract_decimals && _last_24h.data.prices?.[0]?.price === 'number' && (_last_24h.volume / Math.pow(10, _last_24h.data.contract_decimals)),
        }
      })

      setLast24hData({ data, volume: _.sumBy(data, 'normalize_volume') })
    }
  }, [last_24h_data])

  return (
    <div className="max-h-full flex flex-col py-4">
      {last24hData?.data?.findIndex(asset => !(asset?.data)) < 0 ?
        <div className="font-mono text-2xl sm:text-xl lg:text-2xl font-semibold">
          {currency_symbol}{numberFormat(last24hData.volume, '0,0')}
        </div>
        :
        <div className="skeleton w-40 h-8" />
      }
    </div>
  )
}