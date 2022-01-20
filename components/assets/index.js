import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { Img } from 'react-image'
import Loader from 'react-loader-spinner'
import { MdOutlineRouter } from 'react-icons/md'
import { TiArrowRight } from 'react-icons/ti'
import { BsJournalCode } from 'react-icons/bs'
import { BiCode } from 'react-icons/bi'

import Copy from '../copy'
import Popover from '../popover'

import { networks } from '../../lib/menus'
import { currency_symbol } from '../../lib/object/currency'
import { numberFormat, ellipseAddress } from '../../lib/utils'

export default function Assets({ data, assetBy = 'assets', className = '' }) {
  const { preferences, ens, routers_status } = useSelector(state => ({ preferences: state.preferences, ens: state.ens, routers_status: state.routers_status }), shallowEqual)
  const { theme } = { ...preferences }
  const { ens_data } = { ...ens }
  const { routers_status_data } = { ...routers_status }

  const router = useRouter()
  const { pathname, query } = { ...router }
  const { chain_id } = { ...query }
  const network = networks[networks.findIndex(network => network.id === chain_id)] || (pathname.startsWith('/[chain_id]') ? null : networks[0])

  const maxTransfers = data?.chain_id === chain_id && data?.data && _.orderBy(
    Object.values(_.groupBy(data.data.flatMap(_router => _router?.assetBalances.map(_asset => { return { ..._asset, router_id: _router.id } })), 'data.contract_address')).map(_assets => {
      let assets_from_chains

      if (_assets && routers_status_data) {
        assets_from_chains = Object.fromEntries(networks.filter(_network => _network?.network_id && !_network.disabled).map(_network => {
          const assets = _assets.filter(_asset => routers_status_data?.findIndex(_router => _router?.routerAddress?.toLowerCase() === _asset?.router_id?.toLowerCase() && _router?.supportedChains?.includes(network.network_id) && _router.supportedChains.includes(_network.network_id)) > -1)

          return [_network.id, _.maxBy(assets, 'normalize_amount')]
        }).filter(([key, value]) => key !== network.id && value))
      }

      return {
        ..._.maxBy(_assets, 'normalize_amount'),
        total_amount: _.sumBy(_assets, 'amount'),
        total_normalize_amount: _.sumBy(_assets, 'normalize_amount'),
        total_value: _.sumBy(_assets, 'value'),
        assets_from_chains,
      }
    }), ['value'], ['desc']
  )

  return (
    <>
      {assetBy === 'routers' ?
        <div className={`space-y-8 ${className}`}>
          {(data?.chain_id === chain_id ?
            (data?.data || []).filter(router => router?.assetBalances?.findIndex(_assetBalance => _assetBalance?.normalize_amount > 0) > -1).map((router, i) => { return { ...router, i } })
            :
            [...Array(1).keys()].map(i => { return { i, skeleton: true } })
          ).map((router, i) => {
            const routerStatus = routers_status_data?.find(_router => _router?.routerAddress?.toLowerCase() === router?.id?.toLowerCase())

            return (
              <div key={i} className="space-y-4">
                {!router.skeleton ?
                  <div className="space-y-1">
                    <div className={`flex items-${ens_data?.[router.id.toLowerCase()]?.name ? 'start' : 'center'} font-medium space-x-1`}>
                      <MdOutlineRouter size={20} className="text-gray-400 dark:text-gray-500 mb-0.5" />
                      {!ens_data?.[router.id.toLowerCase()]?.name && (
                        <span className="text-gray-400 dark:text-gray-500">Router:</span>
                      )}
                      <div className="space-y-0.5">
                        {ens_data?.[router.id.toLowerCase()]?.name && (
                          <Link href={`/router/${router.id}`}>
                            <a className="text-gray-900 dark:text-white font-semibold">
                              {ens_data[router.id.toLowerCase()].name}
                            </a>
                          </Link>
                        )}
                        <div className="flex items-center space-x-1">
                          {ens_data?.[router.id.toLowerCase()]?.name ?
                            <Copy
                              text={router.id}
                              copyTitle={<span className="text-gray-400 dark:text-gray-500 text-xs font-normal">
                                {ellipseAddress(router.id, 10)}
                              </span>}
                            />
                            :
                            <>
                              <Link href={`/router/${router.id}`}>
                                <a className="text-indigo-600 dark:text-white text-xs font-medium">
                                  {ellipseAddress(router.id, 10)}
                                </a>
                              </Link>
                              <Copy text={router.id} />
                            </>
                          }
                        </div>
                      </div>
                    </div>
                    {routers_status_data && (
                      <div className="flex flex-col sm:flex-row items-start space-y-1 sm:space-y-0 space-x-0 sm:space-x-1.5">
                        <div className="text-gray-400: dark:text-gray-500 text-sm">Supported Chains:</div>
                        <div className="max-w-md flex flex-wrap items-center sm:justify-end">
                          {routerStatus?.supportedChains?.length > 0 ?
                            routerStatus.supportedChains.map((_chain_id, i) => (
                              networks.find(_network => _network?.network_id === _chain_id) && (
                                <Img
                                  key={i}
                                  src={networks.find(_network => _network?.network_id === _chain_id).icon}
                                  alt=""
                                  className="w-5 h-5 rounded-full mb-1 mr-1"
                                />
                              )
                            ))
                            :
                            <span>-</span>
                          }
                        </div>
                      </div>
                    )}
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
                          {assetBalance?.assetId && (
                            <div className="flex items-center space-x-1">
                              <Copy
                                text={assetBalance.assetId}
                                copyTitle={<span className="text-gray-400 dark:text-gray-200 font-medium">
                                  {ellipseAddress(assetBalance.assetId, 6)}
                                </span>}
                              />
                              {network?.explorer?.url && (
                                <a
                                  href={`${network.explorer.url}${network.explorer[`contract${assetBalance.assetId.includes('0x0000000000000000000000000000000000000000') ? '_0' : ''}_path`]?.replace('{address}', assetBalance.assetId)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 dark:text-white"
                                >
                                  {network.explorer.icon ?
                                    <Img
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
                            <span className="font-mono text-lg font-semibold mr-1.5">{typeof assetBalance?.normalize_amount === 'number' ? numberFormat(assetBalance.normalize_amount, '0,0') : assetBalance?.amount && !(assetBalance?.data) ? numberFormat(assetBalance.amount / Math.pow(10, network?.currency?.decimals), '0,0') : '-'}</span>
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
            )
          })}
        </div>
        :
        <div className="w-full grid grid-flow-row grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-8 my-6">
          {(maxTransfers ?
            maxTransfers.map((assetBalance, i) => { return { ...assetBalance, i } })
            :
            [...Array(3).keys()].map(i => { return { i, skeleton: true } })
          ).map((assetBalance, i) => (
            !assetBalance.skeleton ?
              <div key={i} className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-4">
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
                  {assetBalance?.assetId && (
                    <div className="flex items-center space-x-1">
                      <Copy
                        text={assetBalance.assetId}
                        copyTitle={<span className="text-gray-400 dark:text-gray-200 font-medium">
                          {ellipseAddress(assetBalance.assetId, 6)}
                        </span>}
                      />
                      {network?.explorer?.url && (
                        <a
                          href={`${network.explorer.url}${network.explorer[`contract${assetBalance.assetId.includes('0x0000000000000000000000000000000000000000') ? '_0' : ''}_path`]?.replace('{address}', assetBalance.assetId)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-white"
                        >
                          {network.explorer.icon ?
                            <Img
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
                  <div className="uppercase text-gray-400 dark:text-gray-500 text-2xs">Max Transfer Size</div>
                  <div className="flex items-center">
                    <div className="mr-2">
                      <span className="font-mono text-lg font-semibold mr-1.5">{assetBalance?.normalize_amount ? numberFormat(assetBalance.normalize_amount, '0,0') : assetBalance?.amount && !(assetBalance?.data) ? numberFormat(assetBalance.amount / Math.pow(10, network?.currency?.decimals), '0,0') : '-'}</span>
                      <span className="text-gray-600 dark:text-gray-400 text-base">{assetBalance?.data?.contract_ticker_symbol}</span>
                    </div>
                    {assetBalance.assets_from_chains && (
                      <Popover
                        placement="bottom"
                        title={<span className="text-xs">Transfer Routes</span>}
                        content={<div className="w-40 flex-col space-y-1.5">
                          {Object.entries(assetBalance.assets_from_chains).length > 0 ?
                            _.orderBy(Object.entries(assetBalance.assets_from_chains).map(([key, value]) => { return { key, value } }), ['value.normalize_amount'], ['desc']).map(({ key, value }) => (
                              <div key={key} className="flex items-center justify-between">
                                <div className="flex items-center space-x-1.5 mr-1">
                                  {networks?.find(_network => _network?.id === key)?.icon && (
                                    <Img
                                      src={networks.find(_network => _network?.id === key).icon}
                                      alt=""
                                      className="w-5 h-5 rounded-full"
                                    />
                                  )}
                                  <BiCode size={16} className="min-w-min" />
                                  {network.icon && (
                                    <Img
                                      src={network.icon}
                                      alt=""
                                      className="w-5 h-5 rounded-full"
                                    />
                                  )}
                                </div>
                                <div className="text-3xs space-x-1">
                                  <span className="font-mono">{numberFormat(value.normalize_amount, '0,0')}</span>
                                  <span className="text-gray-400 dark:text-gray-500">{value.data?.contract_ticker_symbol}</span>
                                </div>
                              </div>
                            ))
                            :
                            'No Routes'
                          }
                        </div>}
                        className=""
                      >
                        <BsJournalCode size={20} />
                      </Popover>
                    )}
                    {!routers_status_data && (
                      <Loader type="Puff" color={theme === 'dark' ? '#F9FAFB' : '#3B82F6'} width="20" height="20" />
                    )}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 font-medium">~{currency_symbol}{typeof assetBalance?.value === 'number' ? numberFormat(assetBalance.value, '0,0') : ' -'}</div>
                </div>
                <div className="mt-4">
                  <div className="uppercase text-gray-400 dark:text-gray-500 text-2xs">Total Liquidity</div>
                  <div>
                    <span className="font-mono text-lg font-semibold mr-1.5">{assetBalance?.total_normalize_amount ? numberFormat(assetBalance.total_normalize_amount, '0,0') : assetBalance?.total_amount && !(assetBalance?.data) ? numberFormat(assetBalance.total_amount / Math.pow(10, network?.currency?.decimals), '0,0') : '-'}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-base">{assetBalance?.data?.contract_ticker_symbol}</span>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 font-medium">~{currency_symbol}{typeof assetBalance?.total_value === 'number' ? numberFormat(assetBalance.total_value, '0,0') : ' -'}</div>
                </div>
              </div>
              :
              <div key={i} className="skeleton h-60" style={{ borderRadius: '1rem' }} />
          ))}
        </div>
      }
      {data && data.chain_id === chain_id && !(data.data?.length > 0) && (
        <div className="bg-transparent border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-700 text-gray-300 dark:text-gray-700 text-base font-medium italic text-center py-16">
          No Assets
        </div>
      )}
    </>
  )
}