import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { IoRadioButtonOnOutline } from 'react-icons/io5'
import { RiGasStationFill } from 'react-icons/ri'
import { TiArrowRight } from 'react-icons/ti'
import { FaDiscord } from 'react-icons/fa'

import { graphql, assetBalances } from '../../lib/api/subgraph'
import { contracts as getContracts } from '../../lib/api/covalent'
import { domains } from '../../lib/api/ens'
import { coin } from '../../lib/api/coingecko'
import { networks } from '../../lib/menus'
import { currency, currency_symbol } from '../../lib/object/currency'
import { getName, numberFormat } from '../../lib/utils'

import { CHAIN_DATA, CONTRACTS_DATA, CONTRACTS_SYNC_DATA, ASSETS_DATA, ASSETS_SYNC_DATA, ENS_DATA } from '../../reducers/types'

export default function ChainMeta() {
  const dispatch = useDispatch()
  const { data, contracts, contracts_sync, assets, assets_sync, ens } = useSelector(state => ({ data: state.data, contracts: state.contracts, contracts_sync: state.contracts_sync, assets: state.assets, assets_sync: state.assets_sync, ens: state.ens }), shallowEqual)
  const { chain_data } = { ...data }
  const { contracts_data } = { ...contracts }
  const { contracts_sync_data } = { ...contracts_sync }
  const { assets_data } = { ...assets }
  const { assets_sync_data } = { ...assets_sync }
  const { ens_data } = { ...ens }

  const router = useRouter()
  const { pathname, query } = { ...router }
  const { chain_id } = { ...query }
  const network = networks[networks.findIndex(network => network.id === chain_id)] || (pathname.startsWith('/[chain_id]') ? null : networks[0])

  const [assetsLoaded, setAssetsLoaded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    const getData = async () => {
      if (network) {
        let chainData

        let response = network.id && typeof network.network_id === 'number' && !network.disabled && await graphql({ chain_id: network.id, query: '{ _meta { block { hash, number } } }' })

        chainData = { ...chainData, ...response?.data?._meta }

        if (!controller.signal.aborted) {
          if (network?.currency?.coingecko_id) {
            response = await coin(network.currency.coingecko_id)

            chainData = { ...chainData, coin: { ...response } }
          }
        }

        if (!controller.signal.aborted) {
          if (network?.gas?.url) {
            const res = await fetch(network.gas.url)
            response = await res.json()

            chainData = { ...chainData, gas: { ...(response?.result || response?.data || response) } }

            if (chainData.gas) {
              chainData.gas = Object.fromEntries(Object.entries(chainData.gas).filter(([key, value]) => ['SafeGasPrice', 'ProposeGasPrice', 'FastGasPrice', 'standard', 'fast', 'fastest', 'rapid'].includes(key)).map(([key, value]) => [key, value / Math.pow(10, network.gas.decimals)]))
            }
          }
        }

        if (!controller.signal.aborted) {
          if (chainData) {
            dispatch({
              type: CHAIN_DATA,
              value: chainData,
            })
          }
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
    return () => {
      controller?.abort()
      clearInterval(interval)
    }
  }, [network])

  useEffect(() => {
    const getDataSync = async _networks => {
      if (_networks) {
        let assetsData

        for (let i = 0; i < _networks.length; i++) {
          const network = _networks[i]

          const response = await assetBalances({ chain_id: network.id })

          assetsData = _.concat(assetsData || [], response?.data?.map(asset => { return { ...asset, chain_data: network } }) || [])
        }

        dispatch({
          type: ASSETS_SYNC_DATA,
          value: _.groupBy(assetsData, 'chain_data.id'),
        })
      }
    }

    const getData = async isInterval => {
      let assetsData, routerIds
      let assetsSet = false

      if ((['/', '/routers'].includes(pathname) && !assetsLoaded) || !assetsLoaded || isInterval) {
        const _networks = networks.filter(_network => _network.id && !_network.disabled)

        if (isInterval) {
          for (let i = 0; i < _networks.length; i++) {
            const network = _networks[i]

            const response = await assetBalances({ chain_id: network.id })

            assetsData = _.concat(assetsData || [], response?.data?.map(asset => { return { ...asset, chain_data: network } }) || [])
            routerIds = _.uniq(_.concat(routerIds || [], response?.data?.map(asset => asset?.router?.id).filter(id => id) || []))

            // if (!(assets_data?.[network.id]) && !assetsLoaded && (!assetsSet || ['/routers'].includes(pathname))) {
            //   if (assetsData) {
            //     assetsSet = true

            //     if (!(['/'].includes(pathname))) {
            //       dispatch({
            //         type: ASSETS_DATA,
            //         value: { ...assets_data, ..._.groupBy(assetsData, 'chain_data.id') },
            //       })
            //     }
            //   }
            // }
          }
        }
        else if (!assets_data) {
          const chunkSize = _.head([...Array(_networks.length).keys()].map(i => i + 1).filter(i => Math.ceil(_networks.length / i) <= Number(process.env.NEXT_PUBLIC_MAX_CHUNK))) || _networks.length
          _.chunk([...Array(_networks.length).keys()], chunkSize).forEach(chunk => getDataSync(_networks.filter((_n, i) => chunk.includes(i))))
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

        if (routerIds?.length > 0) {
          const response = await domains({ where: `{ resolvedAddress_in: [${routerIds.map(id => `"${id?.toLowerCase()}"`).join(',')}] }` })

          if (response?.data) {
            dispatch({
              type: ENS_DATA,
              value: Object.fromEntries(response.data.map(domain => [domain?.resolvedAddress?.id?.toLowerCase(), { ...domain }])),
            })
          }
        }

        const _contracts = _.groupBy(Object.values({ ...assets_data, ..._.groupBy(assetsData, 'chain_data.id') }).flatMap(assets => assets).filter(asset => asset?.contract_address && !(asset?.data) && !(contracts_data?.findIndex(contract => contract.id === asset.contract_address && contract.data) > -1)), 'chain_data.id')

        let new_contracts

        for (let i = 0; i < Object.entries(_contracts).length; i++) {
          const contract = Object.entries(_contracts)[i]
          const [key, value] = contract
          const resContracts = await getContracts(networks.find(network => network.id === key)?.network_id, value && _.uniq(value.map(_contract => _contract.contract_address)).join(','))

          if (resContracts?.data) {
            new_contracts = _.uniqBy(_.concat(resContracts.data.filter(_contract => _contract).map(_contract => { return { id: `${key}-${_contract?.contract_address}`, chain_id: key, data: { ..._contract } } }), new_contracts || []), 'id')
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

    const interval = setInterval(() => getData(true), 30 * 1000)
    return () => clearInterval(interval)
  }, [assetsLoaded, pathname, assets_data])

  useEffect(async () => {
    const getContractsSync = async _contracts => {
      if (_contracts) {
        let new_contracts

        for (let i = 0; i < _contracts.length; i++) {
          const contract = _contracts[i]
          const [key, value] = contract
          const resContracts = await getContracts(networks.find(network => network.id === key)?.network_id, value && _.uniq(value.map(_contract => _contract.contract_address)).join(','))

          if (resContracts?.data) {
            new_contracts = _.uniqBy(_.concat(resContracts.data.filter(_contract => _contract).map(_contract => { return { id: `${key}-${_contract?.contract_address}`, chain_id: key, data: { ..._contract } } }), new_contracts || []), 'id')
          }
        }

        if (new_contracts) {
          dispatch({
            type: CONTRACTS_SYNC_DATA,
            value: new_contracts,
          })
        }
      }
    }

    if (assets_sync_data) {
      if (Object.keys(assets_sync_data).length >= networks.filter(_network => _network.id && !_network.disabled).length) {
        dispatch({
          type: ASSETS_DATA,
          value: assets_sync_data,
        })

        const routerIds = Object.values(assets_sync_data).flatMap(assets => assets).map(asset => asset?.router?.id)

        if (routerIds?.length > 0) {
          const response = await domains({ where: `{ resolvedAddress_in: [${routerIds.map(id => `"${id?.toLowerCase()}"`).join(',')}] }` })

          if (response?.data) {
            dispatch({
              type: ENS_DATA,
              value: Object.fromEntries(response.data.map(domain => [domain?.resolvedAddress?.id?.toLowerCase(), { ...domain }])),
            })
          }
        }

        const _contracts = Object.entries(_.groupBy(Object.values(assets_sync_data).flatMap(assets => assets), 'chain_data.id'))

        const chunkSize = _.head([...Array(_contracts.length).keys()].map(i => i + 1).filter(i => Math.ceil(_contracts.length / i) <= Number(process.env.NEXT_PUBLIC_MAX_CHUNK))) || _contracts.length
        _.chunk([...Array(_contracts.length).keys()], chunkSize).forEach(chunk => getContractsSync(_contracts.filter((_n, i) => chunk.includes(i))))
      }
    }
  }, [assets_sync_data])

  useEffect(() => {
    if (contracts_sync_data) {
      if (Object.keys(assets_sync_data).length >= networks.filter(_network => _network.id && !_network.disabled).length) {
        if (contracts_sync_data.length >= _.uniqBy(Object.values(assets_sync_data).flatMap(assets => assets).map(asset => { return { id: `${asset?.chain_data?.id}-${asset?.contract_address}` } }), 'id').length) {
          dispatch({
            type: CONTRACTS_DATA,
            value: contracts_sync_data,
          })
        }
      }
    }
  }, [contracts_sync_data, assets_sync_data])

  return (
    <div className="w-full bg-gray-100 dark:bg-gray-900 overflow-x-auto flex items-center py-2 px-2 sm:px-4">
      <span className="min-w-max flex items-center text-2xs space-x-1 mr-3">
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
        <span className="min-w-max flex items-center text-gray-400 dark:text-gray-300 text-2xs space-x-2 pl-1">
          <span className="flex flex-col items-center">
            <RiGasStationFill size={18} className="-mt-2.5" />
            <span className="h-1 text-3xs">Gwei</span>
          </span>
          {_.orderBy(Object.entries(chain_data.gas), 1).map(([key, value], i) => (
            <span key={i} className="flex flex-col items-center space-y-0.5">
              <span className="h-3.5 text-gray-900 dark:text-gray-100 font-medium">{numberFormat(value, '0,0')}</span>
              <span className="h-2.5 capitalize text-3xs">{getName(key)}</span>
            </span>
          ))}
        </span>
      )}
      <span className="ml-3 sm:ml-auto" />
      <div className="flex flex-row space-x-4">
        {chain_data?.coin && (
          <div className="min-w-max flex items-center text-2xs space-x-2.5">
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
            {typeof chain_data.coin.market_data?.market_cap?.[currency] === 'number' && (
              <div className="flex items-center space-x-1">
                <span className="text-gray-400 dark:text-gray-500 font-medium">MCap:</span>
                {typeof chain_data.coin.market_data?.market_cap?.[currency] === 'number' ?
                  <span>{currency_symbol}{numberFormat(chain_data.coin.market_data.market_cap[currency], '0,0')}</span>
                  :
                  <span>-</span>
                }
              </div>
            )}
            {typeof chain_data.coin.market_data?.total_volume?.[currency] === 'number' && (
              <div className="flex items-center space-x-1">
                <span className="text-gray-400 dark:text-gray-500 font-medium">24 Vol:</span>
                {typeof chain_data.coin.market_data?.total_volume?.[currency] === 'number' ?
                  <span className="uppercase">{currency_symbol}{numberFormat(chain_data.coin.market_data.total_volume[currency], '0,0.00a')}</span>
                  :
                  <span>-</span>
                }
              </div>
            )}
            {typeof chain_data.coin.market_data?.circulating_supply === 'number' && (
              <div className="flex items-center space-x-1">
                <span className="text-gray-400 dark:text-gray-500 font-medium">Supply:</span>
                {typeof chain_data.coin.market_data?.circulating_supply === 'number' ?
                  <span>{numberFormat(chain_data.coin.market_data.circulating_supply, '0,0')}</span>
                  :
                  <span>-</span>
                }
              </div>
            )}
          </div>
        )}
        {network?.info_url && (
          <a
            href={network.info_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-indigo-600 dark:text-white text-2xs font-semibold"
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
            className="flex items-center text-indigo-600 dark:text-white text-2xs font-semibold"
          >
            <span>{network.explorer.name || 'Explorer'}</span>
            <TiArrowRight size={16} className="transform -rotate-45" />
          </a>
        )}
        {process.env.NEXT_PUBLIC_DISCORD_URL && (
          <a
            href={process.env.NEXT_PUBLIC_DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-indigo-600 dark:text-white text-2xs font-semibold space-x-1"
          >
            <FaDiscord size={16} />
            <span>Discord</span>
          </a>
        )}
      </div>
    </div>
  )
}