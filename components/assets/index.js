import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { Img } from 'react-image'
import { MdOutlineRouter } from 'react-icons/md'
import { TiArrowRight } from 'react-icons/ti'

import Copy from '../copy'

import { networks } from '../../lib/menus'
import { currency_symbol } from '../../lib/object/currency'
import { numberFormat, ellipseAddress } from '../../lib/utils'

export default function Assets({ data, className = '' }) {
  const router = useRouter()
  const { pathname, query } = { ...router }
  const { chain_id } = { ...query }
  const network = networks[networks.findIndex(network => network.id === chain_id)] || (pathname.startsWith('/[chain_id]') ? null : networks[0])

  return (
    <>
      <div className={`space-y-8 ${className}`}>
        {(data?.chain_id === chain_id ?
          (data?.data || []).map((router, i) => { return { ...router, i } })
          :
          [...Array(1).keys()].map(i => { return { i, skeleton: true } })
        ).map((router, i) => (
          <div key={i} className="space-y-4">
            {!router.skeleton ?
              <div className="flex items-center space-x-1">
                <MdOutlineRouter size={20} className="mb-0.5" />
                <span className="font-medium">Router:</span>
                <Copy
                  text={router.id}
                  copyTitle={<span className="text-gray-400 dark:text-gray-200 text-xs font-medium">
                    {ellipseAddress(router.id, 6)}
                  </span>}
                />
              </div>
              :
              <div className="skeleton w-40 h-5" />
            }
            <div className="w-full grid grid-flow-row grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-8">
              {!router.skeleton ?
                router.assetBalances?.map((assetBalance, j) => (
                  <div key={j} className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-4">
                    <div className="space-y-2">
                      {assetBalance?.data && (
                        <div className="flex items-center space-x-1.5">
                          {assetBalance.data.logo_url && (
                            <Img
                              src={assetBalance.data.logo_url}
                              alt=""
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <div className="text-sm font-semibold">{assetBalance.data.contract_name}</div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs font-normal">{assetBalance.data.contract_ticker_symbol}</div>
                          </div>
                        </div>
                      )}
                      {assetBalance?.id && (
                        <div className="flex items-center space-x-1">
                          <Copy
                            text={assetBalance.id.replace(`-${router.id}`, '')}
                            copyTitle={<span className="text-gray-400 dark:text-gray-200 font-medium">
                              {ellipseAddress(assetBalance.id.replace(`-${router.id}`, ''), 6)}
                            </span>}
                          />
                          {network?.explorer?.url && (
                            <a
                              href={`${network.explorer.url}${network.explorer.contract_path?.replace('{address}', assetBalance.id.replace(`-${router.id}`, ''))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 dark:text-white"
                            >
                              {network.explorer.icon ?
                                <img
                                  src={network.explorer.icon}
                                  alt=""
                                  className="w-4 h-4 rounded-full opacity-60 hover:opacity-100"
                                />
                                :
                                <TiArrowRight size={16} className="transform -rotate-45" />
                              }
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <div className="uppercase text-gray-400 dark:text-gray-500 text-2xs">Liquidity</div>
                      <div>
                        <span className="font-mono text-lg font-semibold mr-1.5">{assetBalance?.normalize_amount ? numberFormat(assetBalance.normalize_amount, '0,0') : assetBalance?.amount && !(assetBalance?.data) ? numberFormat(assetBalance.amount / Math.pow(10, network?.currency?.decimals), '0,0') : '-'}</span>
                        <span className="text-gray-600 dark:text-gray-400 text-base">{assetBalance?.data?.contract_ticker_symbol}</span>
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 font-medium">~{currency_symbol}{typeof assetBalance?.value === 'number' ? numberFormat(assetBalance.value, '0,0') : ' -'}</div>
                    </div>
                  </div>
                ))
                :
                [...Array(3).keys()].map(j => (
                  <div key={j} className="skeleton h-44" style={{ borderRadius: '1rem' }} />
                ))
              }
            </div>
          </div>
        ))}
      </div>
      {data && data.chain_id === chain_id && !(data.data?.length > 0) && (
        <div className="bg-transparent border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-700 text-gray-300 dark:text-gray-700 text-base font-medium italic text-center py-16">
          No Assets
        </div>
      )}
    </>
  )
}