import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'
import moment from 'moment'
import { NxtpSdk } from '@connext/nxtp-sdk'
import { Img } from 'react-image'
import StackGrid from 'react-stack-grid'
import { IoRadioButtonOn } from 'react-icons/io5'
import { FiBox } from 'react-icons/fi'
import { MdOutlineRouter } from 'react-icons/md'
import { TiArrowRight } from 'react-icons/ti'

import Widget from '../../widget'

import { networks } from '../../../lib/menus'
import { currency_symbol } from '../../../lib/object/currency'
import { numberFormat } from '../../../lib/utils'

export default function Status() {
  const { contracts, assets, chains_status, routers_status } = useSelector(state => ({ contracts: state.contracts, assets: state.assets, chains_status: state.chains_status, routers_status: state.routers_status }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }
  const { chains_status_data } = { ...chains_status }
  const { routers_status_data } = { ...routers_status }

  const [chainsLiquidity, setChainsLiquidity] = useState(null)
  const [timer, setTimer] = useState(null)

  useEffect(() => {
    if (assets_data && contracts_data) {
      const data = Object.entries(assets_data).map(([key, value]) => {
        return {
          id: key,
          assets: value?.map(asset => {
            return {
              ...asset,
              data: contracts_data?.find(contract => contract.id?.replace(`${asset?.chain_data?.id}-`, '') === asset?.contract_address)?.data,
            }
          }).map(asset => {
            return {
              ...asset,
              normalize_amount: asset?.data?.contract_decimals && (asset.amount / Math.pow(10, asset.data.contract_decimals)),
              normalize_locked: asset?.data?.contract_decimals && ((asset.locked || 0) / Math.pow(10, asset.data.contract_decimals)),
              normalize_supplied: asset?.data?.contract_decimals && ((asset.supplied || 0) / Math.pow(10, asset.data.contract_decimals)),
              normalize_removed: asset?.data?.contract_decimals && ((asset.removed || 0) / Math.pow(10, asset.data.contract_decimals)),
              normalize_volume: asset?.data?.contract_decimals && ((asset.volume || 0) / Math.pow(10, asset.data.contract_decimals)),
              normalize_volumeIn: asset?.data?.contract_decimals && ((asset.volumeIn || 0) / Math.pow(10, asset.data.contract_decimals)),
            }
          }).map(asset => {
            return {
              ...asset,
              value: typeof asset?.normalize_amount === 'number' && typeof asset?.data?.prices?.[0]?.price === 'number' && (asset.normalize_amount * asset.data.prices[0].price),
              value_locked: typeof asset?.normalize_locked === 'number' && typeof asset?.data?.prices?.[0]?.price === 'number' && (asset.normalize_locked * asset.data.prices[0].price),
              value_supplied: typeof asset?.normalize_supplied === 'number' && typeof asset?.data?.prices?.[0]?.price === 'number' && (asset.normalize_supplied * asset.data.prices[0].price),
              value_removed: typeof asset?.normalize_removed === 'number' && typeof asset?.data?.prices?.[0]?.price === 'number' && (asset.normalize_removed * asset.data.prices[0].price),
              value_volume: typeof asset?.normalize_volume === 'number' && typeof asset?.data?.prices?.[0]?.price === 'number' && (asset.normalize_volume * asset.data.prices[0].price),
              value_volumeIn: typeof asset?.normalize_volumeIn === 'number' && typeof asset?.data?.prices?.[0]?.price === 'number' && (asset.normalize_volumeIn * asset.data.prices[0].price),
            }
          }),
        }
      }).map(chain => {
        return {
          ...chain,
          liquidity: _.sumBy(chain?.assets || [], 'value'),
          total_liquidity: _.sumBy(chain?.assets || [], 'value') + _.sumBy(chain?.assets || [], 'value_locked'),
          volume: _.sumBy(chain?.assets || [], 'value_volume'),
        }
      })

      setChainsLiquidity(data)
    }
  }, [contracts_data, assets_data])

  useEffect(() => {
    const run = async () => setTimer(moment().unix())

    if (!timer) {
      run()
    }

    const interval = setInterval(() => run(), 0.5 * 1000)
    return () => clearInterval(interval)
  }, [timer])

  const chainsStatus = networks.filter(_network => _network?.id && !_network.disabled).map(_network => {
    return {
      ..._network,
      ...chains_status_data?.find(_chain => _chain?.id === _network?.id),
      ...chainsLiquidity?.find(_chain => _chain?.id === _network?.id),
      routers: routers_status_data?.filter(_router => _router?.supportedChains?.includes(_network?.network_id)),
    }
  })

  const chainsStatusComponent = chainsStatus?.filter(chainStatus => chainStatus).map((chainStatus, i) => (
    <Widget
      key={i}
      title={<div className="flex items-center space-x-1">
        <Link href={`/${chainStatus.id}`}>
          <a className="text-gray-900 dark:text-white font-semibold">
            {chainStatus.title}
          </a>
        </Link>
      </div>}
      right={chains_status_data ?
        <div className="flex items-center text-sm space-x-1.5">
          <IoRadioButtonOn size={14} className={`${chainStatus.synced ? 'text-green-600 dark:text-green-500' : 'text-red-500 dark:text-red-600'}`} />
          <span className={`capitalize ${!chainStatus.synced ? 'text-red-500 dark:text-red-600' : 'text-green-600 dark:text-green-500'}`}>
            {!chainStatus.synced ? 'unsynced' : 'synced'}
          </span>
        </div>
        :
        <div className="skeleton w-16 h-5" />
      }
    >
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center text-2xs space-x-1">
          <span>Latest</span>
          <FiBox size={16} />
          {chains_status_data ?
            <a
              href={`${chainStatus.explorer?.url}${chainStatus.explorer?.block_path?.replace('{block}', chainStatus.latestBlock)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-gray-600 dark:text-gray-400"
            >
              {numberFormat(chainStatus.latestBlock, '0,0')}
            </a>
            :
            <div className="skeleton w-16 h-4" />
          }
        </div>
        <div className="flex items-center text-2xs space-x-1">
          <span>Synced</span>
          <FiBox size={16} />
          {chains_status_data ?
            <a
              href={`${chainStatus.explorer?.url}${chainStatus.explorer?.block_path?.replace('{block}', chainStatus.syncedBlock)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-gray-600 dark:text-gray-400"
            >
              {numberFormat(chainStatus.syncedBlock, '0,0')}
            </a>
            :
            <div className="skeleton w-16 h-4" />
          }
        </div>
      </div>
      <div className="flex items-center justify-center my-6">
        <Link href={`/${chainStatus.id}`}>
          <a>
            <Img
              src={chainStatus.icon}
              alt=""
              className="w-20 h-20 rounded-full"
            />
          </a>
        </Link>
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center text-sm space-x-2">
          <span>Volume:</span>
          {chainsLiquidity ?
            <span className="font-mono font-semibold">
              {currency_symbol}{numberFormat(chainStatus.volume, '0,0')}
            </span>
            :
            <div className="skeleton w-16 h-4" />
          }
        </div>
        <div className="flex items-center text-sm space-x-1.5">
          <MdOutlineRouter size={20} className="mb-0.5" />
          {routers_status_data ?
            <span className="font-mono font-semibold">
              {numberFormat(chainStatus.routers?.length, '0,0')}
            </span>
            :
            <div className="skeleton w-6 h-4" />
          }
          <span>Router{!routers_status_data || chainStatus.routers?.length > 1 ? 's' : ''}</span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center text-sm space-x-2">
          <span>Liquidity:</span>
          {chainsLiquidity ?
            <span className="font-mono font-semibold">
              {currency_symbol}{numberFormat(chainStatus.liquidity, '0,0')}
            </span>
            :
            <div className="skeleton w-16 h-4" />
          }
        </div>
        <Link href={`/${chainStatus.id}`}>
          <a
            className="flex items-center text-indigo-600 dark:text-indigo-500 font-semibold"
          >
            <span>Liquidity</span>
            <TiArrowRight size={20} className="transform -rotate-45 -mr-1" />
          </a>
        </Link>
      </div>
    </Widget>
  ))

  return (
    <>
      <StackGrid
        columnWidth={320}
        gutterWidth={16}
        gutterHeight={16}
        className="hidden sm:block"
      >
        {chainsStatusComponent}
      </StackGrid>
      <div className="block sm:hidden space-y-3">
        {chainsStatusComponent}
      </div>
    </>
  )
}