import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'

import { currency_symbol } from '../../../lib/object/currency'
import { numberFormat } from '../../../lib/utils'

export default function TotalLiquidity({ className = '' }) {
  const { contracts, assets } = useSelector(state => ({ contracts: state.contracts, assets: state.assets }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }

  const [liquidity, setLiquidity] = useState(null)

  useEffect(() => {
    if (assets_data) {
      const data = Object.values(assets_data).flatMap(asset_data => asset_data.map(asset => {
        return {
          ...asset,
          data: contracts_data?.find(contract => contract.id === asset.contract_address)?.data,
        }
      }).map(asset => {
        return {
          ...asset,
          normalize_amount: asset?.data?.contract_decimals && (asset.amount / Math.pow(10, asset.data.contract_decimals)),
        }
      }).map(asset => {
        return {
          ...asset,
          value: typeof asset?.normalize_amount === 'number' && typeof asset?.data?.prices?.[0].price === 'number' && (asset?.normalize_amount * asset?.data?.prices?.[0].price),
        }
      }))

      setLiquidity({ data, liquidity: _.sumBy(data, 'value'), num_chain: _.uniqBy(data, 'chain_data.id').length })
    }
  }, [contracts_data, assets_data])

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-3 pt-8 pb-12">
      {liquidity?.liquidity > 0 ?
        <div className="font-mono text-2xl font-extrabold text-center">
          {currency_symbol}{numberFormat(liquidity.liquidity, '0,0')}
        </div>
        :
        <div className="skeleton w-48 h-8" />
      }
      {liquidity?.data?.findIndex(asset => !(asset?.data)) < 0 ?
        <div className="text-gray-400 dark:text-gray-600 text-base font-light text-center space-x-2">
          <span>across</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium">{numberFormat(liquidity.num_chain, '0,0')}</span>
          <span>chain{liquidity.num_chain > 1 ? 's' : ''}</span>
        </div>
        :
        <div className="skeleton w-36 h-4" />
      }
    </div>
  )
}