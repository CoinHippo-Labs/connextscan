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

      setLiquidity({ data, liquidity: _.sumBy(data, 'value'), num_chains: _.uniqBy(data, 'chain_data.id').length, num_contracts: data.length })
    }
  }, [contracts_data, assets_data])

  return (
    <div className="h-full flex flex-col items-center justify-center pt-8 pb-12">
      {liquidity?.data?.findIndex(asset => !(asset?.data)) < 0 ?
        <div className="font-mono text-2xl font-extrabold text-center">
          {currency_symbol}{numberFormat(liquidity.liquidity, '0,0')}
        </div>
        :
        <div className="skeleton w-40 h-8" />
      }
      <div className="h-3" />
      {liquidity?.data?.findIndex(asset => !(asset?.data)) < 0 ?
        <div className="text-gray-400 dark:text-gray-600 text-base font-light text-center space-x-2">
          <span>across</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium">{numberFormat(liquidity.num_chains, '0,0')}</span>
          <span>chain{liquidity.num_chains > 1 ? 's' : ''}</span>
        </div>
        :
        <div className="skeleton w-36 h-5 mt-1" />
      }
      <div className="h-2" />
      {liquidity?.data?.findIndex(asset => !(asset?.data)) < 0 ?
        <div className="text-gray-400 dark:text-gray-600 text-sm font-light text-center space-x-1.5">
          <span>from</span>
          <span className="text-gray-600 dark:text-gray-400 font-medium">{numberFormat(liquidity.num_contracts, '0,0')}</span>
          <span>contract{liquidity.num_contracts > 1 ? 's' : ''}</span>
          <span>in total</span>
        </div>
        :
        <div className="skeleton w-48 h-4 mt-1" />
      }
    </div>
  )
}