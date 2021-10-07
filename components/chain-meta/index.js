import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import { TiArrowRight } from 'react-icons/ti'

import { graphql } from '../../lib/api/subgraph'
import { coin } from '../../lib/api/coingecko'
import { networks } from '../../lib/menus'
import { numberFormat, ellipseAddress } from '../../lib/utils'

import { CHAIN_DATA } from '../../reducers/types'

const CURRENCY = 'usd'
const CURRENCY_SYMBOL = '$'

export default function ChainMeta() {
  const dispatch = useDispatch()
  const { data } = useSelector(state => ({ data: state.data }), shallowEqual)
  const { chain_data } = { ...data }

  const router = useRouter()
  const { pathname, query } = { ...router }
  const { chain_id } = { ...query }
  const network = networks[networks.findIndex(network => network.id === chain_id)] || (pathname.startsWith('/[chain_id]') ? null : networks[0])

  useEffect(() => {
    const getData = async () => {
      let chainData

      let response = await graphql({ chain_id: network.id, query: '{ _meta { block { hash, number } } }' })

      chainData = { ...chainData, ...response?.data?._meta }

      if (network?.currency?.coingecko_id) {
        response = await coin(network.currency.coingecko_id)

        chainData = { ...chainData, coin: { ...response } }
      }

      if (chainData) {
        dispatch({
          type: CHAIN_DATA,
          value: chainData
        })
      }
    }

    if (network) {
      getData()
    }

    const interval = setInterval(() => getData(), 15 * 1000)
    return () => clearInterval(interval)
  }, [network])

  return (
    <div className="w-full bg-gray-100 dark:bg-gray-800 overflow-x-auto flex items-center py-2 px-2 sm:px-4">
      <span className="min-w-max flex items-center space-x-1" style={{ fontSize: '.65rem' }}>
        <span className="text-gray-600 dark:text-gray-400">Synced Block:</span>
        {typeof chain_data?.block?.number === 'number' ?
          network?.explorer ?
            <a
              href={`${network.explorer.url}${network.explorer.block_path?.replace('{block}', chain_data.block.number)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-white font-semibold"
            >
              {numberFormat(chain_data.block.number, '0,0')}
            </a>
            :
            <span className="font-medium">{numberFormat(chain_data?.block?.number, '0,0')}</span>
          :
          chain_data?.block ?
            <span className="font-medium">-</span>
            :
            <div className="skeleton w-12 h-4 rounded" />
        }
      </span>
      <span className="ml-3 md:ml-auto" />
      <div className="flex flex-row space-x-4">
        {chain_data?.coin && (
          <div className="min-w-max flex items-center space-x-2.5" style={{ fontSize: '.65rem' }}>
            <div className="flex items-center space-x-1">
              <img
                src={chain_data.coin.image?.thumb || network?.icon}
                alt=""
                className="w-4 h-4 rounded-full"
              />
              <span className="uppercase font-medium">{chain_data.coin.symbol || network?.currency?.symbol}</span>
            </div>
            <div className="flex items-center space-x-1">
              {typeof chain_data.coin.market_data?.current_price?.[CURRENCY] === 'number' && (
                <span>{CURRENCY_SYMBOL}{numberFormat(chain_data.coin.market_data.current_price[CURRENCY], '0,0.000000')}</span>
              )}
              {typeof chain_data.coin.market_data?.price_change_percentage_24h_in_currency?.[CURRENCY] === 'number' && (
                <span className={`text-${chain_data.coin.market_data.price_change_percentage_24h_in_currency[CURRENCY] < 0 ? 'red' : 'green'}-500 font-medium`}>{numberFormat(chain_data.coin.market_data.price_change_percentage_24h_in_currency[CURRENCY], '+0,0.000')}%</span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-400 dark:text-gray-500 font-medium">MCap:</span>
              {typeof chain_data.coin.market_data?.market_cap?.[CURRENCY] === 'number' ?
                <span>{CURRENCY_SYMBOL}{numberFormat(chain_data.coin.market_data.market_cap[CURRENCY], '0,0')}</span>
                :
                <span>-</span>
              }
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-400 dark:text-gray-500 font-medium">24 Vol:</span>
              {typeof chain_data.coin.market_data?.total_volume?.[CURRENCY] === 'number' ?
                <span className="uppercase">{CURRENCY_SYMBOL}{numberFormat(chain_data.coin.market_data.total_volume[CURRENCY], '0,0.00a')}</span>
                :
                <span>-</span>
              }
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-400 dark:text-gray-500 font-medium">Supply:</span>
              {typeof chain_data.coin.market_data?.circulating_supply === 'number' ?
                <span>{numberFormat(chain_data.coin.market_data.circulating_supply, '0,0')}</span>
                :
                <span>-</span>
              }
            </div>
          </div>
        )}
        {network?.info_url && (
          <a
            href={network.info_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-indigo-600 dark:text-white text-xs font-semibold"
            style={{ fontSize: '.65rem' }}
          >
            <span className="capitalize">website</span>
            <TiArrowRight size={16} className="transform -rotate-45" />
          </a>
        )}
        {network?.explorer?.url && (
          <a
            href={network.explorer.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-indigo-600 dark:text-white text-xs font-semibold"
            style={{ fontSize: '.65rem' }}
          >
            <span>{network.explorer.name || 'Explorer'}</span>
            <TiArrowRight size={16} className="transform -rotate-45" />
          </a>
        )}
      </div>
    </div>
  )
}