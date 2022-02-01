import Link from 'next/link'
import { useSelector, shallowEqual } from 'react-redux'

import { Img } from 'react-image'

import { currency, currency_symbol } from '../../../lib/object/currency'
import { numberFormat } from '../../../lib/utils'

export default function SubNavbar() {
  const { status, asset_balances } = useSelector(state => ({ status: state.status, asset_balances: state.asset_balances }), shallowEqual)
  const { status_data } = { ...status }
  const { asset_balances_data } = { ...asset_balances }

  return (
    <div className="w-full bg-gray-100 dark:bg-gray-900 overflow-x-auto flex items-center py-2 px-2 sm:px-4">
      <div className="flex items-center space-x-1.5 mr-4">
        <div className="flex items-center text-gray-500 dark:text-gray-500 space-x-1.5">
          {denom?.image && (
            <Img
              src={denom.image}
              alt=""
              className="w-5 h-5"
            />
          )}
          <span>Price</span>
          :
        </div>
        {env_data?.token_data ?
          env_data.token_data[currency] ?
            <span className="font-mono font-semibold">{currency_symbol}{numberFormat(env_data.token_data[currency], '0,0.00000000')}</span>
            :
            <span>-</span>
          :
          <div className="skeleton w-12 h-4" />
        }
      </div>
      <div className="flex items-center space-x-1.5 mr-4">
        <div className="flex items-center text-gray-500 dark:text-gray-500 space-x-1.5">
          <span>MCap</span>
          :
        </div>
        {env_data?.token_data ?
          env_data.token_data[`${currency}_market_cap`] ?
            <span className="font-mono font-semibold">{currency_symbol}{numberFormat(env_data.token_data[`${currency}_market_cap`], '0,0')}</span>
            :
            <span>-</span>
          :
          <div className="skeleton w-16 h-4" />
        }
      </div>

      {/*<div className="flex items-center space-x-1.5 mr-4">
        <div className="flex items-center text-gray-500 dark:text-gray-500 space-x-1">
          <span>Latest</span>
          <FiBox size={14} className="mb-0.5" />
          :
        </div>
        {status_data ?
          status_data.latest_block_height ?
            <Link href={`/block/${status_data.latest_block_height}`}>
              <a className="font-mono text-blue-600 dark:text-white font-semibold">
                {numberFormat(status_data?.latest_block_height, '0,0')}
              </a>
            </Link>
            :
            <span>-</span>
          :
          <div className="skeleton w-16 h-4" />
        }
      </div>
      <div className="flex items-center space-x-1.5 mr-4">
        <div className="flex items-center text-gray-500 dark:text-gray-500 space-x-1">
          <span>Max</span>
          <BiServer size={16} className="mb-0.5" />
          :
        </div>
        {env_data?.staking_params ?
          env_data.staking_params.max_validators ?
            <Link href="/validators">
              <a className="font-mono text-blue-600 dark:text-white font-semibold">
                {numberFormat(env_data.staking_params.max_validators, '0,0')}
              </a>
            </Link>
            :
            <span>-</span>
          :
          <div className="skeleton w-8 h-4" />
        }
      </div>
      <div className="flex items-center space-x-1.5 mr-4">
        <div className="flex items-center text-gray-500 dark:text-gray-500 space-x-1">
          <span className="whitespace-nowrap">Axelar Core</span>
          :
        </div>
        {env_data?.['axelar-core_version'] ?
          <span className="font-mono font-semibold">{env_data['axelar-core_version']}</span>
          :
          <div className="skeleton w-12 h-4" />
        }
      </div>
      <span className="sm:ml-auto" />
      <div className="flex items-center space-x-1.5 mr-4">
        <div className="flex items-center text-gray-500 dark:text-gray-500 space-x-1.5">
          <span>Proposer</span>
          <FiGift size={14} className="mb-0.5" />
          :
        </div>
        {env_data?.distribution_params ?
          env_data.distribution_params.base_proposer_reward ?
            <div className="whitespace-nowrap space-x-1">
              <span className="font-mono font-semibold">{numberFormat(Number(env_data.distribution_params.base_proposer_reward) * 100, '0,0.00')}%</span>
              {!isNaN(env_data.distribution_params.bonus_proposer_reward) && (
                <span className="font-mono text-gray-600 dark:text-gray-400 text-2xs font-normal">
                  (+{numberFormat(Number(env_data.distribution_params.bonus_proposer_reward) * 100, '0,0.00')}% Bonus)
                </span>
              )}
            </div>
            :
            <span>-</span>
          :
          <div className="skeleton w-16 h-4" />
        }
      </div>
      <div className="flex items-center space-x-1.5 mr-4">
        <div className="flex items-center text-gray-500 dark:text-gray-500 space-x-1.5">
          <span>Inflation</span>
          :
        </div>
        {typeof env_data?.inflation === 'number' ?
          <span className="font-mono font-semibold">{numberFormat(env_data.inflation * 100, '0,0.00')}%</span>
          :
          <div className="skeleton w-8 h-4" />
        }
      </div>
      <div className="flex items-center space-x-1.5 mr-4">
        <div className="flex items-center text-gray-500 dark:text-gray-500 space-x-1.5">
          <span>Tax</span>
          :
        </div>
        {env_data?.distribution_params ?
          env_data.distribution_params.community_tax ?
            <span className="font-mono font-semibold">{numberFormat(Number(env_data.distribution_params.community_tax) * 100, '0,0.00')}%</span>
            :
            <span>-</span>
          :
          <div className="skeleton w-8 h-4" />
        }
      </div>
      <div className="flex items-center space-x-1.5">
        <div className="flex items-center text-gray-500 dark:text-gray-500 space-x-1.5">
          <span className="whitespace-nowrap">Community Pool</span>
          :
        </div>
        {env_data?.community_pool ?
          env_data.community_pool.length > 0 ?
            <div className="space-x-2">
              {env_data.community_pool.map((_pool, i) => (
                <span key={i} className="space-x-1">
                  <span className="font-mono font-semibold">{numberFormat(_pool?.amount, '0,0.00000000')}</span>
                  <span className="font-semibold">{_pool?.denom}</span>
                </span>
              ))}
            </div>
            :
            <span>-</span>
          :
          <div className="skeleton w-16 h-4" />
        }
      </div>
      */}
    </div>
  )
}