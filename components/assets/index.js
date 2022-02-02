import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'
import moment from 'moment'
import Web3 from 'web3'
import { constants, utils } from 'ethers'
import { Img } from 'react-image'
import Loader from 'react-loader-spinner'
import StackGrid from 'react-stack-grid'
import { MdOutlineRouter } from 'react-icons/md'
import { TiArrowRight } from 'react-icons/ti'
import { BsJournalCode } from 'react-icons/bs'
import { GoCode } from 'react-icons/go'

import Copy from '../copy'
import Popover from '../popover'
import Widget from '../widget'

import { currency_symbol } from '../../lib/object/currency'
import { numberFormat, ellipseAddress } from '../../lib/utils'

export default function Assets({ assetBy = 'assets' }) {
  const { preferences, chains, ens, routers_status, asset_balances, routers_assets } = useSelector(state => ({ preferences: state.preferences, chains: state.chains, ens: state.ens, routers_status: state.routers_status, asset_balances: state.asset_balances, routers_assets: state.routers_assets }), shallowEqual)
  const { theme } = { ...preferences }
  const { chains_data } = { ...chains }
  const { ens_data } = { ...ens }
  const { routers_status_data } = { ...routers_status }
  const { asset_balances_data } = { ...asset_balances }
  const { routers_assets_data } = { ...routers_assets }

  const router = useRouter()
  const { query } = { ...router }
  const { blockchain_id } = { ...query }

  const [web3, setWeb3] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [addTokenData, setAddTokenData] = useState(null)
  const [timer, setTimer] = useState(null)

  useEffect(() => {
    if (!web3) {
      setWeb3(new Web3(Web3.givenProvider))
    }
    else {
      try {
        web3.currentProvider._handleChainChanged = e => {
          try {
            setChainId(Web3.utils.hexToNumber(e?.chainId))
          } catch (error) {}
        }
      } catch (error) {}
    }
  }, [web3])

  useEffect(() => {
    if (addTokenData?.chain_id === chainId && addTokenData?.contract) {
      addTokenToMetaMask(addTokenData.chain_id, addTokenData.contract)
    }
  }, [chainId, addTokenData])

  useEffect(() => {
    const run = async () => setTimer(moment().unix())

    if (!timer) {
      run()
    }

    const interval = setInterval(() => run(), 0.5 * 1000)
    return () => clearInterval(interval)
  }, [timer])

  const addTokenToMetaMask = async (chain_id, contract) => {
    if (web3 && contract) {
      if (chain_id === chainId) {
        try {
          const response = await web3.currentProvider.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC20',
              options: {
                address: contract.contract_address,
                symbol: contract.symbol,
                decimals: contract.contract_decimals,
                image: `${contract.image?.startsWith('/') ? process.env.NEXT_PUBLIC_SITE_URL : ''}${contract.image}`,
              },
            },
          })
        } catch (error) {}

        setAddTokenData(null)
      }
      else {
        switchNetwork(chain_id, contract)
      }
    }
  }

  const switchNetwork = async (chain_id, contract) => {
    try {
      await web3.currentProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: utils.hexValue(chain_id) }],
      })
    } catch (error) {
      if (error.code === 4902) {
        try {
          await web3.currentProvider.request({
            method: 'wallet_addEthereumChain',
            params: chains_data?.find(c => c.chain_id === chain_id)?.provider_params,
          })
        } catch (error) {
          console.log(error)
        }
      }
    }

    if (contract) {
      setAddTokenData({ chain_id, contract })
    }
  }

  const chain = chains_data?.find(c => c?.id === blockchain_id)

  const maxTransfers = null/*data?.chain_id === chain_id && data?.data && _.orderBy(
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
  )*/

  const routersComponent = _.cloneDeep(routers_assets_data)?.filter(ra => !routers_status_data || routers_status_data.findIndex(r => r?.routerAddress?.toLowerCase() === ra?.router_id?.toLowerCase() && r?.supportedChains?.includes(chain?.chain_id)) > -1).map(ra => {
    return {
      ...ra,
      asset_balances: ra?.asset_balances?.filter(ab => ab?.chain?.chain_id === chain?.chain_id),
    }
  }).filter(ra => ra?.asset_balances?.length > 0).map((ra, i) => {
    const routerStatus = routers_status_data?.find(r => r?.routerAddress?.toLowerCase() === ra?.router_id?.toLowerCase())

    return (
      <Widget
        key={i}
        title={<div className="flex items-center justify-between space-x-2">
          <div className={`flex items-${ens_data?.[ra?.router_id.toLowerCase()]?.name ? 'start' : 'center'} space-x-1.5`}>
            <MdOutlineRouter size={20} className="text-gray-400 dark:text-gray-600 mb-0.5" />
            {ra?.router_id && (
              <div className="space-y-0.5">
                {ens_data?.[ra.router_id.toLowerCase()]?.name && (
                  <div className="flex items-center">
                    <Img
                      src={`${process.env.NEXT_PUBLIC_ENS_AVATAR_URL}/${ens_data[ra.router_id.toLowerCase()].name}`}
                      alt=""
                      className="w-6 h-6 rounded-full mr-2"
                    />
                    <Link href={`/router/${ra.router_id}`}>
                      <a className="text-blue-600 dark:text-white sm:text-base font-semibold">
                        {ellipseAddress(ens_data[ra.router_id.toLowerCase()].name, 16)}
                      </a>
                    </Link>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  {ens_data?.[ra.router_id.toLowerCase()]?.name ?
                    <Copy
                      text={ra.router_id}
                      copyTitle={<span className="text-gray-400 dark:text-gray-600 text-xs font-normal">
                        {ellipseAddress(ra.router_id, 8)}
                      </span>}
                    />
                    :
                    <>
                      <Link href={`/router/${ra.router_id}`}>
                        <a className="text-blue-600 dark:text-white text-xs font-normal">
                          {ellipseAddress(ra.router_id, 8)}
                        </a>
                      </Link>
                      <Copy text={ra.router_id} />
                    </>
                  }
                </div>
              </div>
            )}
          </div>
          {routerStatus && (
            <div className="text-right space-y-1.5">
              <div className="whitespace-nowrap uppercase text-gray-400 dark:text-gray-600 text-3xs font-medium">Supported Chains</div>
              <div className="w-32 sm:w-48 flex flex-wrap items-center justify-end">
                {routerStatus.supportedChains?.length > 0 ?
                  chains_data && routerStatus.supportedChains.map((id, i) => (
                    <Img
                      key={i}
                      src={chains_data.find(c => c?.chain_id === id)?.image}
                      alt=""
                      className="w-4 h-4 rounded-full mb-1 ml-1"
                    />
                  ))
                  :
                  <span>-</span>
                }
              </div>
            </div>
          )}
        </div>}
        className="border-0 shadow-md rounded-2xl"
      >
        <div className="grid grid-flow-row grid-cols-2 sm:grid-cols-3 gap-0 mt-4 mb-2">
          {_.orderBy(ra?.asset_balances?.flatMap(abs => abs) || [], ['amount_value', 'amount'], ['desc', 'desc']).map((ab, j) => {
            const addToMetaMaskButton = (
              <button
                onClick={() => addTokenToMetaMask(ab.chain.chain_id, { ...ab.asset })}
                className="w-auto bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded flex items-center justify-center py-1 px-1.5"
              >
                <Img
                  src="/logos/wallets/metamask.png"
                  alt=""
                  className="w-3 h-3"
                />
              </button>
            )

            return (
              <div key={j}>
                {ab?.asset ?
                  <div className="min-h-full border pt-2.5 pb-3 px-2" style={{ borderColor: ab?.chain?.color }}>
                    <div className="space-y-0.5">
                      <div className="flex items-start">
                        {ab.asset.image && (
                          <Img
                            src={ab.asset.image}
                            alt=""
                            className="w-4 h-4 mr-1"
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="text-2xs font-semibold">{ab.asset.name}</span>
                          {ab.assetId && (
                            <span className="min-w-max flex items-center space-x-1">
                              <Copy
                                size={10}
                                text={ab.assetId}
                                copyTitle={<span className="text-gray-400 dark:text-gray-600 text-3xs font-medium">
                                  {ellipseAddress(ab.assetId, 4)}
                                </span>}
                              />
                              {ab?.chain?.explorer?.url && (
                                <a
                                  href={`${ab.chain.explorer.url}${ab.chain.explorer[`contract${ab.assetId === constants.AddressZero ? '_0' : ''}_path`]?.replace('{address}', ab.assetId)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-white"
                                >
                                  {ab.chain.explorer.icon ?
                                    <img
                                      src={ab.chain.explorer.icon}
                                      alt=""
                                      className="w-3 h-3 rounded-full opacity-60 hover:opacity-100"
                                    />
                                    :
                                    <TiArrowRight size={16} className="transform -rotate-45" />
                                  }
                                </a>
                              )}
                            </span>
                          )}
                        </div>
                        {ab?.chain?.image && (
                          <Link href={`/${ab.chain.id}`}>
                            <a className="hidden sm:block min-w-max w-3 h-3 relative -top-1 -right-1 ml-auto">
                              <Img
                                src={ab.chain.image}
                                alt=""
                                className="w-3 h-3 rounded-full"
                              />
                            </a>
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-center mt-1.5">
                      <div className="w-full text-center space-y-1">
                        <div className="font-mono text-xs">
                          {typeof ab?.amount === 'number' ?
                            <>
                              <span className={`uppercase ${ab?.amount_value > 100000 ? 'font-semibold' : 'text-gray-700 dark:text-gray-300 font-medium'} mr-1.5`}>
                                {numberFormat(ab.amount, ab.amount > 10000 ? '0,0.00a' : ab.amount > 10 ? '0,0' : '0,0.000')}
                              </span>
                              <span className="text-gray-400 dark:text-gray-600 font-medium">{ab?.asset?.symbol}</span>
                            </>
                            :
                            <span className="text-gray-400 dark:text-gray-600">n/a</span>
                          }
                        </div>
                        <div className="max-w-min bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-3xs mx-auto py-1 px-2">
                          {typeof ab?.amount_value === 'number' ?
                            <span className={`uppercase ${ab?.amount_value > 100000 ? 'text-gray-800 dark:text-gray-200 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                              {currency_symbol}{numberFormat(ab.amount_value, ab.amount_value > 100000 ? '0,0.00a' : ab.amount_value > 1000 ? '0,0' : '0,0.000')}
                            </span>
                            :
                            <span className="text-gray-400 dark:text-gray-600">n/a</span>
                          }
                        </div>
                      </div>
                      <div className="min-w-max relative -bottom-2.5 -right-2 mb-0.5 ml-auto">
                        <Popover
                          placement="left"
                          title={<span className="normal-case text-3xs">Add token</span>}
                          content={<div className="w-28 text-3xs">Add <span className="font-semibold">{ab.asset.symbol}</span> to MetaMask</div>}
                          titleClassName="py-0.5"
                          contentClassName="py-1.5"
                        >
                          {addToMetaMaskButton}
                        </Popover>
                      </div>
                    </div>
                  </div>
                  :
                  <div className="w-full h-24 shadow flex items-center justify-center">
                    <Loader type="Triangle" color={theme === 'dark' ? '#F9FAFB' : '#3B82F6'} width="16" height="16" />
                  </div>
                }
              </div>
            )
          })}
        </div>
      </Widget>
    )
  })

  return (
    <>
      {assetBy === 'routers' ?
        !routers_status_data ?
          <div className="w-full flex items-center justify-center">
            <Loader type="Oval" color={theme === 'dark' ? '#F9FAFB' : '#3B82F6'} width="24" height="24" />
          </div>
          :
          routersComponent.length < 1 ?
            <div className="w-full text-gray-400 dark:text-gray-600 text-base italic text-center">
              No Routers Supported
            </div>
            :
            <>
              <StackGrid
                columnWidth={458}
                gutterWidth={16}
                gutterHeight={16}
                className="hidden sm:block"
              >
                {routersComponent}
              </StackGrid>
              <div className="block sm:hidden space-y-3">
                {routersComponent}
              </div>
            </>
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
                                  <GoCode size={16} className="min-w-min" />
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
    </>
  )
}