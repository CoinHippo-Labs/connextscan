import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { IoRadioButtonOnOutline } from 'react-icons/io5'
import { RiGasStationFill } from 'react-icons/ri'
import { TiArrowRight } from 'react-icons/ti'

import { graphql, assetBalances } from '../../lib/api/subgraph'
import { contracts as getContracts } from '../../lib/api/covalent'
import { coin } from '../../lib/api/coingecko'
import { networks } from '../../lib/menus'
import { currency, currency_symbol } from '../../lib/object/currency'
import { numberFormat } from '../../lib/utils'

import { CHAIN_DATA, CONTRACTS_DATA, ASSETS_DATA } from '../../reducers/types'

export default function ChainMeta() {
  const dispatch = useDispatch()
  const { data, contracts, assets } = useSelector(state => ({ data: state.data, contracts: state.contracts, assets: state.assets }), shallowEqual)
  const { chain_data } = { ...data }
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }

  const router = useRouter()
  const { pathname, query } = { ...router }
  const { chain_id } = { ...query }
  const network = networks[networks.findIndex(network => network.id === chain_id)] || (pathname.startsWith('/[chain_id]') ? null : networks[0])

  const [assetsLoaded, setAssetsLoaded] = useState(false)

  useEffect(() => {
    const getData = async () => {
      if (network) {
        let chainData

        let response = network.id && typeof network.network_id === 'number' && !network.disabled && await graphql({ chain_id: network.id, query: '{ _meta { block { hash, number } } }' })

        chainData = { ...chainData, ...response?.data?._meta }

        if (network?.currency?.coingecko_id) {
          response = await coin(network.currency.coingecko_id)

          chainData = { ...chainData, coin: { ...response } }
        }

        if (network?.gas?.url) {
          const res = await fetch(network.gas.url)
          response = await res.json()

          chainData = { ...chainData, gas: { ...(response?.data || response) } }

          if (chainData.gas) {
            chainData.gas = Object.fromEntries(Object.entries(chainData.gas).filter(([key, value]) => ['standard', 'fast', 'fastest', 'rapid'].includes(key)).map(([key, value]) => [key, value / Math.pow(10, network.gas.decimals)]))
          }
        }

        if (chainData) {
          dispatch({
            type: CHAIN_DATA,
            value: chainData,
          })
        }
      }
    }

    if (network) {
      dispatch({
        type: CHAIN_DATA,
        value: null,
      })

      getData()
    }

    const interval = setInterval(() => getData(), 15 * 1000)
    return () => clearInterval(interval)
  }, [network])

  useEffect(() => {
    const getData = async () => {
      let assetsData
      let assetsSet = false

      for (let i = 0; i < networks.length; i++) {
        const network = networks[i]

        if (network && network.id && typeof network.network_id === 'number' && !network.disabled) {
          const response = await assetBalances({ chain_id: network.id })

          assetsData = _.concat(assetsData || [], response?.data?.map(asset => { return { ...asset, chain_data: network } }) || [])
        
          if (!(assets_data?.[network.id]) && !assetsLoaded && (!assetsSet || ['/bridges'].includes(pathname))) {
            if (assetsData) {
              assetsSet = true

              if (!(['/'].includes(pathname))) {
                dispatch({
                  type: ASSETS_DATA,
                  value: { ...assets_data, ..._.groupBy(assetsData, 'chain_data.id') },
                })
              }
            }
          }
        }
      }

      if (assetsData) {
        if (!assetsLoaded && assetsSet) {
          setAssetsLoaded(true)
        }

        dispatch({
          type: ASSETS_DATA,
          value: { ...assets_data, ..._.groupBy(assetsData, 'chain_data.id') },
        })

        const _contracts = _.groupBy(_.uniqBy(Object.values({ ...assets_data, ..._.groupBy(assetsData, 'chain_data.id') }).flatMap(assets => assets).filter(asset => asset?.contract_address && !(asset?.data) && !(contracts_data?.findIndex(contract => contract.id === asset.contract_address && contract.data) > -1)), 'contract_address'), 'chain_data.id')

        let new_contracts

        for (let i = 0; i < Object.entries(_contracts).length; i++) {
          const contract = Object.entries(_contracts)[i]
          const key = contract?.[0], value = contract?.[1]

          const resContracts = await getContracts(networks.find(network => network.id === key)?.network_id, value?.map(_contract => _contract.contract_address).join(','))

          if (resContracts?.data) {
            new_contracts = _.uniqBy(_.concat(resContracts.data.filter(_contract => _contract).map(_contract => { return { id: _contract?.contract_address, chain_id: key, data: { ..._contract } } }), new_contracts || []), 'id')
          }
        }

        new_contracts = _.uniqBy(_.concat(new_contracts || [], contracts_data || []), 'id')

        if (new_contracts) {
          dispatch({
            type: CONTRACTS_DATA,
            value: new_contracts,
          })
        }
      }
    }

    getData()

    const interval = setInterval(() => getData(), 60 * 1000)
    return () => clearInterval(interval)
  }, [assetsLoaded])

  return (
    <div className="w-full bg-gray-100 dark:bg-gray-900 overflow-x-auto flex items-center py-2 px-2 sm:px-4">
      <span className="min-w-max flex items-center space-x-1 mr-3" style={{ fontSize: '.65rem' }}>
        {network?.explorer && (!chain_data || chain_data?.block) && (
          <span className="flex items-center text-gray-600 dark:text-gray-400 space-x-0.5">
            {typeof chain_data?.block?.number === 'number' && (
              <IoRadioButtonOnOutline size={10} className="text-green-500" />
            )}
            <span>Synced Block:</span>
          </span>
        )}
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
          network?.explorer ?
            chain_data ?
              <span className="font-medium">-</span>
              :
              <div className="skeleton w-12 h-4" />
            :
            null
        }
      </span>
      {chain_data?.gas && (
        <span className="min-w-max flex items-center text-gray-400 dark:text-gray-300 space-x-2 pl-1" style={{ fontSize: '.65rem' }}>
          <span className="flex flex-col items-center">
            <RiGasStationFill size={18} style={{ marginTop: '-.4rem' }} />
            <span className="h-1" style={{ fontSize: '.5rem', marginTop: '-.25rem' }}>Gwei</span>
          </span>
          {_.orderBy(Object.entries(chain_data.gas), 1).map(([key, value], i) => (
            <span key={i} className="flex flex-col items-center space-y-0.5">
              <span className="h-3.5 text-gray-900 dark:text-gray-100 font-medium">{numberFormat(value, '0,0')}</span>
              <span className="h-2.5 capitalize" style={{ fontSize: '.5rem' }}>{key}</span>
            </span>
          ))}
        </span>
      )}
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
              {typeof chain_data.coin.market_data?.current_price?.[currency] === 'number' && (
                <span>{currency_symbol}{numberFormat(chain_data.coin.market_data.current_price[currency], '0,0.000000')}</span>
              )}
              {typeof chain_data.coin.market_data?.price_change_percentage_24h_in_currency?.[currency] === 'number' && (
                <span className={`text-${chain_data.coin.market_data.price_change_percentage_24h_in_currency[currency] < 0 ? 'red' : 'green'}-500 font-medium`}>{numberFormat(chain_data.coin.market_data.price_change_percentage_24h_in_currency[currency], '+0,0.000')}%</span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-400 dark:text-gray-500 font-medium">MCap:</span>
              {typeof chain_data.coin.market_data?.market_cap?.[currency] === 'number' ?
                <span>{currency_symbol}{numberFormat(chain_data.coin.market_data.market_cap[currency], '0,0')}</span>
                :
                <span>-</span>
              }
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-400 dark:text-gray-500 font-medium">24 Vol:</span>
              {typeof chain_data.coin.market_data?.total_volume?.[currency] === 'number' ?
                <span className="uppercase">{currency_symbol}{numberFormat(chain_data.coin.market_data.total_volume[currency], '0,0.00a')}</span>
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