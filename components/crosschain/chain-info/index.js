import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { IoRadioButtonOnOutline } from 'react-icons/io5'
import { BsFileEarmarkCheck } from 'react-icons/bs'

import { numberFormat } from '../../../lib/utils'

export default function ChainInfo({ className = '' }) {
  const { contracts, assets } = useSelector(state => ({ contracts: state.contracts, assets: state.assets }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }

  const router = useRouter()
  const { pathname } = { ...router }

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
          value: typeof asset?.normalize_amount === 'number' && typeof asset?.data?.prices?.[0]?.price === 'number' && (asset.normalize_amount * asset.data.prices[0].price),
        }
      }))

      setLiquidity({ data, liquidity: _.sumBy(data, 'value'), num_chains: _.uniqBy(data, 'chain_data.id').length, num_contracts: _.uniqBy(data, 'data.contract_address').length })
    }
  }, [contracts_data, assets_data])

  return (
    <div className="flex flex-wrap items-center">
      {liquidity?.data?.findIndex(asset => !(asset?.data)) < 0 ?
        <>
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center text-base space-x-1.5 my-1 sm:my-0 mr-2 sm:mr-2.5 py-1.5 px-2">
            <IoRadioButtonOnOutline size={14} className="text-green-500" />
            <span className="uppercase text-gray-900 dark:text-white font-semibold">{numberFormat(liquidity.num_chains, '0,0')}</span>
            <span className="capitalize">chain{liquidity.num_chains > 1 ? 's' : ''}</span>
          </div>
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center text-base space-x-1.5 my-1 sm:my-0 py-1.5 px-2">
            <BsFileEarmarkCheck size={18} className="text-gray-600 dark:text-gray-400 mb-0.5" />
            <span className="uppercase text-gray-900 dark:text-white font-semibold">{numberFormat(liquidity.num_contracts, '0,0')}</span>
            <span className="capitalize">contract{liquidity.num_contracts > 1 ? 's' : ''}</span>
          </div>
        </>
        :
        ['/', '/bridges'].includes(pathname) ?
          <>
            <div className="skeleton w-24 h-7 my-1 sm:my-0 mr-2 sm:mr-2.5" />
            <div className="skeleton w-28 h-7 my-1 sm:my-0" />
          </>
          :
          null
      }
    </div>
  )
}