import Link from 'next/link'
import { useSelector, shallowEqual } from 'react-redux'

import { Img } from 'react-image'
import { FaDiscord } from 'react-icons/fa'
import { TiArrowRight } from 'react-icons/ti'

import { currency, currency_symbol } from '../../../lib/object/currency'
import { numberFormat } from '../../../lib/utils'

export default function SubNavbar() {
  const { status, asset_balances } = useSelector(state => ({ status: state.status, asset_balances: state.asset_balances }), shallowEqual)
  const { status_data } = { ...status }
  const { asset_balances_data } = { ...asset_balances }

  const { token_data } = { ...status_data }

  return (
    <div className="w-full bg-gray-100 dark:bg-gray-900 overflow-x-auto flex items-center py-2 px-2 sm:px-4">
      {status_data?.info_url && (
        <a
          href={status_data.info_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-indigo-600 dark:text-white font-semibold mr-4"
        >
          <span>Website</span>
          <TiArrowRight size={20} className="transform -rotate-45" />
        </a>
      )}
      {status_data?.explorer?.url && (
        <a
          href={status_data.explorer.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-indigo-600 dark:text-white font-semibold mr-4"
        >
          <span>{status_data.explorer.name || 'Explorer'}</span>
          <TiArrowRight size={20} className="transform -rotate-45" />
        </a>
      )}
      {process.env.NEXT_PUBLIC_BRIDGE_URL && (
        <a
          href={process.env.NEXT_PUBLIC_BRIDGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-indigo-600 dark:text-white font-semibold mr-4"
        >
          <Img
            src="/logos/externals/xpollinate.png"
            alt=""
            className="w-4 h-4 mr-2"
          />
          <span>Bridge</span>
          <TiArrowRight size={20} className="transform -rotate-45" />
        </a>
      )}
      {process.env.NEXT_PUBLIC_DISCORD_URL && (
        <a
          href={process.env.NEXT_PUBLIC_DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-indigo-600 dark:text-white font-semibold mr-4"
        >
          <FaDiscord size={16} className="mr-1.5" />
          <span>Support</span>
          <TiArrowRight size={20} className="transform -rotate-45" />
        </a>
      )}
      <span className="sm:ml-auto" />
      {token_data && (
        <>
          <div className="flex items-center space-x-1.5 mr-4">
            <div className="min-w-max flex items-center text-gray-500 dark:text-gray-500 space-x-1.5">
              {token_data.image?.thumb && (
                <img
                  src={token_data.image.thumb}
                  alt=""
                  className="w-5 h-5"
                />
              )}
              <span className="uppercase text-black dark:text-white font-semibold">{token_data.symbol}</span>
              <span>Price</span>
              :
            </div>
            {typeof token_data.market_data?.current_price?.[currency] === 'number' ?
              <span className="font-mono font-semibold">{currency_symbol}{numberFormat(token_data.market_data.current_price[currency], '0,0.00000000')}</span>
              :
              <span>-</span>
            }
            {typeof token_data.market_data?.price_change_percentage_24h_in_currency?.[currency] === 'number' && (
              <span className={`text-${token_data.market_data.price_change_percentage_24h_in_currency[currency] < 0 ? 'red' : 'green'}-500 font-medium`}>
                {numberFormat(token_data.market_data.price_change_percentage_24h_in_currency[currency], '+0,0.000')}%
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1.5 mr-4">
            <div className="flex items-center text-gray-500 dark:text-gray-500 space-x-1.5">
              <span>MCap</span>
              :
            </div>
            {typeof token_data.market_data?.market_cap?.[currency] === 'number' ?
              <span className="font-mono uppercase font-semibold">{currency_symbol}{numberFormat(token_data.market_data.market_cap[currency], '0,0.00a')}</span>
              :
              <span>-</span>
            }
          </div>
          <div className="flex items-center space-x-1.5 mr-4">
            <div className="flex items-center text-gray-500 dark:text-gray-500 space-x-1.5">
              <span className="whitespace-nowrap">24 Vol</span>
              :
            </div>
            {typeof token_data.market_data?.total_volume?.[currency] === 'number' ?
              <span className="font-mono uppercase font-semibold">{currency_symbol}{numberFormat(token_data.market_data.total_volume[currency], '0,0.00a')}</span>
              :
              <span>-</span>
            }
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="flex items-center text-gray-500 dark:text-gray-500 space-x-1.5">
              <span>Supply</span>
              :
            </div>
            {typeof token_data.market_data?.circulating_supply === 'number' ?
              <span className="font-mono uppercase font-semibold">{numberFormat(token_data.market_data.circulating_supply, '0,0.00a')}</span>
              :
              <span>-</span>
            }
          </div>
        </>
      )}
    </div>
  )
}