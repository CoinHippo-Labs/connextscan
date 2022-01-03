import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { Img } from 'react-image'
import Loader from 'react-loader-spinner'
import { MdOutlineRouter } from 'react-icons/md'
import { TiArrowRight } from 'react-icons/ti'
import { BsFileEarmarkCheck } from 'react-icons/bs'

import Transactions from '../../components/crosschain/transactions'
import SectionTitle from '../../components/section-title'
import Copy from '../../components/copy'
import Widget from '../../components/widget'

import { transactions as getTransactions } from '../../lib/api/subgraph'
import { contracts as getContracts, balances } from '../../lib/api/covalent'
import { networks } from '../../lib/menus'
import { type } from '../../lib/object/id'
import { currency_symbol } from '../../lib/object/currency'
import { numberFormat, ellipseAddress } from '../../lib/utils'

import { CONTRACTS_DATA, ROUTER_BALANCES_SYNC_DATA } from '../../reducers/types'

export default function RouterAddress() {
  const dispatch = useDispatch()
  const { contracts, assets, ens, router_balances_sync, routers_status } = useSelector(state => ({ contracts: state.contracts, assets: state.assets, ens: state.ens, router_balances_sync: state.router_balances_sync, routers_status: state.routers_status }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }
  const { ens_data } = { ...ens }
  const { router_balances_sync_data } = { ...router_balances_sync }
  const { routers_status_data } = { ...routers_status }

  const router = useRouter()
  const { query } = { ...router }
  const { address } = { ...query }

  const [routerAssets, setRouterAssets] = useState(null)
  const [routerChains, setRouterChains] = useState(null)
  const [routerGasOnChains, setRouterGasOnChains] = useState(null)
  const [retryGas, setRetryGas] = useState(null)
  const [transactions, setTransactions] = useState(null)

  useEffect(() => {
    let _address = address

    if (type(_address) === 'router' && ens_data && Object.entries(ens_data).findIndex(([key, value]) => value?.name?.toLowerCase() === _address?.toLowerCase()) > -1) {
      _address = Object.entries(ens_data).find(([key, value]) => value?.name?.toLowerCase() === _address?.toLowerCase())[0]

      router.push(`/router/${_address}`)
    }
  }, [address, ens_data])

  useEffect(() => {
    if (assets_data) {
      const data = _.head(Object.entries(
        _.groupBy(Object.values(assets_data).flatMap(asset_data => asset_data.map(asset => {
          return {
            ...asset,
            data: contracts_data?.find(contract => contract.id?.replace(`${asset?.chain_data?.id}-`, '') === asset?.contract_address)?.data,
          }
        }).map(asset => {
          return {
            ...asset,
            normalize_amount: asset?.data?.contract_decimals && (asset.amount / Math.pow(10, asset.data.contract_decimals)),
            normalize_locked: asset?.data?.contract_decimals && ((asset.locked || 0) / Math.pow(10, asset.data.contract_decimals)),
            normalize_lockedIn: asset?.data?.contract_decimals && ((asset.lockedIn || 0) / Math.pow(10, asset.data.contract_decimals)),
            normalize_supplied: asset?.data?.contract_decimals && ((asset.supplied || 0) / Math.pow(10, asset.data.contract_decimals)),
            normalize_removed: asset?.data?.contract_decimals && ((asset.removed || 0) / Math.pow(10, asset.data.contract_decimals)),
            normalize_volume: asset?.data?.contract_decimals && ((asset.volume || 0) / Math.pow(10, asset.data.contract_decimals)),
            normalize_volumeIn: asset?.data?.contract_decimals && ((asset.volumeIn || 0) / Math.pow(10, asset.data.contract_decimals)),
            normalize_receivingFulfillTxCount: Number(asset.receivingFulfillTxCount) || 0,
          }
        }).map(asset => {
          return {
            ...asset,
            value: typeof asset?.normalize_amount === 'number' && typeof asset?.data?.prices?.[0]?.price === 'number' && (asset.normalize_amount * asset.data.prices[0].price),
            value_locked: typeof asset?.normalize_locked === 'number' && typeof asset?.data?.prices?.[0]?.price === 'number' && (asset.normalize_locked * asset.data.prices[0].price),
            value_lockedIn: typeof asset?.normalize_lockedIn === 'number' && typeof asset?.data?.prices?.[0]?.price === 'number' && (asset.normalize_lockedIn * asset.data.prices[0].price),
            value_supplied: typeof asset?.normalize_supplied === 'number' && typeof asset?.data?.prices?.[0]?.price === 'number' && (asset.normalize_supplied * asset.data.prices[0].price),
            value_removed: typeof asset?.normalize_removed === 'number' && typeof asset?.data?.prices?.[0]?.price === 'number' && (asset.normalize_removed * asset.data.prices[0].price),
            value_volume: typeof asset?.normalize_volume === 'number' && typeof asset?.data?.prices?.[0]?.price === 'number' && (asset.normalize_volume * asset.data.prices[0].price),
            value_volumeIn: typeof asset?.normalize_volumeIn === 'number' && typeof asset?.data?.prices?.[0]?.price === 'number' && (asset.normalize_volumeIn * asset.data.prices[0].price),
          }
        })), 'router.id')
      ).filter(([key, value]) => key === address?.toLowerCase()).map(([key, value]) => {
        return {
          router_id: key,
          assets: _.groupBy(_.orderBy(value, ['value'], ['desc']), 'chain_data.id'),
         }
      }).map(assets => {
        return {
          ...assets,
          liquidity: assets &&_.sumBy(Object.values(assets.assets).flatMap(_assets => _assets), 'value'),
          liquidity_locked: assets &&_.sumBy(Object.values(assets.assets).flatMap(_assets => _assets), 'value_locked'),
          liquidity_lockedIn: assets &&_.sumBy(Object.values(assets.assets).flatMap(_assets => _assets), 'value_lockedIn'),
          liquidity_supplied: assets &&_.sumBy(Object.values(assets.assets).flatMap(_assets => _assets), 'value_supplied'),
          liquidity_removed: assets &&_.sumBy(Object.values(assets.assets).flatMap(_assets => _assets), 'value_removed'),
          liquidity_volume: assets &&_.sumBy(Object.values(assets.assets).flatMap(_assets => _assets), 'value_volume'),
          liquidity_volumeIn: assets &&_.sumBy(Object.values(assets.assets).flatMap(_assets => _assets), 'value_volumeIn'),
          total_receivingFulfillTxCount: assets &&_.sumBy(Object.values(assets.assets).flatMap(_assets => _assets), 'normalize_receivingFulfillTxCount'),
        }
      }))

      setRouterAssets(data)
    }
  }, [contracts_data, assets_data])

  useEffect(() => {
    if (address && type(address) !== 'router' && ens_data && routerAssets?.assets && Object.values(routerAssets.assets).filter(_assets => _assets?.length > 0).length > 0) {
      const _routerChains = {
        id: routerAssets.router_id,
        chains: Object.entries(routerAssets.assets).filter(([key, value]) => key && value?.length > 0).map(([key, value]) => {
          return {
            id: key,
            chain_id: networks.find(_network => _network?.id === key && _network?.network_id)?.network_id,
          }
        })
      }

      if (!_.isEqual({ ..._routerChains, chains: _.orderBy(_routerChains?.chains, 'chain_id') }, { ...routerChains, chains: _.orderBy(routerChains?.chains, 'chain_id') })) {
        setRouterChains(_routerChains)
      }
    }
  }, [address, ens_data, routerAssets, routerChains])

  useEffect(() => {
    const controller = new AbortController()

    const getDataSync = async chains => {
      if (chains) {
        let balancesData

        for (let i = 0; i < chains.length; i++) {
          if (!controller.signal.aborted) {
            const chain = chains[i]

            const response = await balances(chain.chain_id, routerChains?.id)

            const network = networks.find(_network => _network.id === chain.id)

            balancesData = _.concat(balancesData || [], (response?.data?.items || [{ logo_url: network?.icon, contract_name: network?.currency?.name, contract_ticker_symbol: network?.currency?.gas_symbol }]).map(_balance => { return { ..._balance, order: networks.findIndex(_network => _network.id === chain.id), chain_data: network } }).filter(_balance => _balance?.contract_ticker_symbol?.toLowerCase() === network?.currency?.gas_symbol?.toLowerCase()) || [])
          }
        }

        if (!controller.signal.aborted) {
          dispatch({
            type: ROUTER_BALANCES_SYNC_DATA,
            value: Object.fromEntries(chains.map(_chain => [_chain.id, balancesData?.length > 0 ? balancesData.filter(_balance => _balance?.chain_data?.id === _chain.id) : null])),
          })
        }
      }
    }

    const getData = async isInterval => {
      if (routerChains?.chains && (!routerGasOnChains || retryGas || isInterval)) {
        if (!retryGas) {
          dispatch({
            type: ROUTER_BALANCES_SYNC_DATA,
            value: null,
          })
        }

        const _chains = routerChains.chains.filter(_chain => retryGas && routerGasOnChains ? routerGasOnChains.findIndex(__chain => __chain?.chain_data?.id === _chain?.id && !__chain.balance) > -1 : true)

        const chunkSize = _.head([...Array(_chains.length).keys()].map(i => i + 1).filter(i => Math.ceil(_chains.length / i) <= Number(process.env.NEXT_PUBLIC_MAX_CHUNK * 2))) || _chains.length
        _.chunk([...Array(_chains.length).keys()], chunkSize).forEach(chunk => getDataSync(_chains.filter((_c, i) => chunk.includes(i))))
      }
    }

    getData()

    const interval = setInterval(() => getData(), 5 * 60 * 1000)
    return () => {
      controller?.abort()
      clearInterval(interval)
    }
  }, [routerChains, routerGasOnChains, retryGas])

  useEffect(() => {
    if (router_balances_sync_data && Object.keys(router_balances_sync_data).length === routerChains?.chains?.length) {
      setRetryGas(false)

      setRouterGasOnChains(_.uniqBy(_.orderBy(Object.values(router_balances_sync_data).flatMap(value => value).filter(value => value), ['order'], ['asc']), 'chain_data.id'))

      if (Object.values(router_balances_sync_data).findIndex(_balance => !_balance?.balance) > -1) {
        setRetryGas(true)
      }
      else {
        dispatch({
          type: ROUTER_BALANCES_SYNC_DATA,
          value: null,
        })
      }
    }
  }, [routerChains, router_balances_sync_data])

  useEffect(() => {
    const controller = new AbortController()

    const getData = async () => {
      if (address) {
        let data, allTransactions, _contracts_data = _.cloneDeep(contracts_data)

        for (let i = 0; i < networks.length; i++) {
          if (!controller.signal.aborted) {
            const network = networks[i]

            if (network && network.id && typeof network.network_id === 'number' && !network.disabled) {
              const response = await getTransactions({ chain_id: network.id, where: `{ router: "${address.toLowerCase()}" }`, max_size: 500 }, _contracts_data)

              if (response) {
                const _data = Array.isArray(response.data) ? response.data : []

                const _contracts = _.groupBy(_.uniqBy(_data.flatMap(tx => [{ id: tx.sendingAssetId, chain_id: tx.sendingChainId, data: tx.sendingAsset }, { id: tx.receivingAssetId, chain_id: tx.receivingChainId, data: tx.receivingAsset }]).filter(asset => asset.id && !(asset?.data) && !(_contracts_data?.findIndex(contract => contract.id?.replace(`${networks.find(_network => _network.network_id === asset?.chain_id)?.id}-`, '') === asset.id && contract.data) > -1)).map(asset => { return { ...asset, _id: `${networks.find(_network => _network.network_id === asset?.chain_id)?.id}-${asset?.id}` } }), '_id'), 'chain_id')

                let new_contracts

                for (let j = 0; j < Object.entries(_contracts).length; j++) {
                  if (!controller.signal.aborted) {
                    const contract = Object.entries(_contracts)[j]
                    let [key, value] = contract
                    key = Number(key)

                    const resContracts = await getContracts(key, value?.map(_contract => _contract.id).join(','))

                    if (resContracts?.data) {
                      new_contracts = _.uniqBy(_.concat(resContracts.data.filter(_contract => _contract).map(_contract => { return { id: _contract?.contract_address, chain_id: key, data: { ..._contract }, id: `${networks.find(_network => _network.network_id === key)?.id}-${_contract?.contract_address}` } }), new_contracts || []), 'id')
                    }
                  }
                }

                new_contracts = _.uniqBy(_.concat(new_contracts || [], _contracts_data || []), 'id')

                allTransactions = _.concat(allTransactions || [], _data)

                data = _.orderBy(Object.entries(_.groupBy(_.orderBy(_.concat(data || [], allTransactions.map(tx => {
                  return {
                    ...tx,
                    sendingAsset: tx.sendingAsset || new_contracts?.find(contract => contract.id?.replace(`${networks.find(_network => _network.network_id === tx.sendingChainId)?.id}-`, '') === tx.sendingAssetId && contract.data)?.data,
                    receivingAsset: tx.receivingAsset || new_contracts?.find(contract => contract.id?.replace(`${networks.find(_network => _network.network_id === tx.receivingChainId)?.id}-`, '') === tx.receivingAssetId && contract.data)?.data,
                  }
                }).map(tx => {
                  return {
                    ...tx,
                    normalize_amount: ((tx.sendingChainId === network.network_id && tx.sendingAsset?.contract_decimals) || (tx.receivingChainId === network.network_id && tx.receivingAsset?.contract_decimals)) && (tx.amount / Math.pow(10, (tx.sendingChainId === network.network_id && tx.sendingAsset?.contract_decimals) || (tx.receivingChainId === network.network_id && tx.receivingAsset?.contract_decimals))),
                  }
                })), ['order', 'preparedTimestamp'], ['desc', 'desc']), 'transactionId')).map(([key, value]) => { return { txs: _.orderBy(_.uniqBy(value, 'chainId'), ['order', 'preparedTimestamp'], ['asc', 'asc']).map(tx => { return { id: tx.chainTx, chain_id: tx.chainId, status: tx.status } }), ...(_.maxBy(value, ['order', 'preparedTimestamp'])) } }), ['preparedTimestamp'], ['desc'])
                .map(tx => { return { ...tx, crosschain_status: tx.status === 'Prepared' && tx.txs?.length === 1 && tx.txs[0]?.chain_id === tx.sendingChainId ? 'Preparing' : tx.status === 'Fulfilled' && tx.txs?.findIndex(_tx => _tx?.status === 'Prepared') > -1 ? 'Fulfilling' : tx.status } })

                _contracts_data = new_contracts

                if (data.length > 0) {
                  setTransactions({ data, address })
                }
              }
            }
          }
        }

        if (!(data?.length > 0)) {
          setTransactions({ data: [], address })
        }

        if (!controller.signal.aborted) {
          if (_contracts_data) {
            dispatch({
              type: CONTRACTS_DATA,
              value: _contracts_data,
            })
          }
        }
      }
    }

    getData()

    const interval = setInterval(() => getData(), 2 * 60 * 1000)
    return () => {
      controller?.abort()
      clearInterval(interval)
    }
  }, [address])

  const routerStatus = routers_status_data?.find(_router => _router?.routerAddress?.toLowerCase() === address?.toLowerCase())

  return (
    <>
      <SectionTitle
        title={<div className="flex items-center space-x-1.5">
          <MdOutlineRouter size={20} className="mb-0.5" />
          <span>Router</span>
          {routerStatus?.isRouterContract && (
            <div className="max-w-min bg-blue-500 dark:bg-indigo-600 rounded-xl capitalize flex items-center text-white text-xs space-x-1 py-1 px-2.5">
              <BsFileEarmarkCheck size={14} />
              <span>Contract</span>
            </div>
          )}
        </div>}
        subtitle={<div>
          {ens_data?.[address?.toLowerCase()]?.name && (
            <div className="flex items-center">
              <Img
                src={`${process.env.NEXT_PUBLIC_ENS_AVATAR_URL}/${ens_data[address?.toLowerCase()].name}`}
                alt=""
                className="w-8 h-8 rounded-full mr-3"
              />
              <span>{ens_data?.[address?.toLowerCase()]?.name}</span>
            </div>
          )}
          <Copy
            size={ens_data?.[address?.toLowerCase()]?.name ? 12 : 24}
            text={address}
            copyTitle={<div className={`${ens_data?.[address?.toLowerCase()]?.name ? 'text-gray-400 dark:text-gray-500 text-xs font-normal mr-0.5' : 'uppercase text-gray-900 dark:text-gray-100 font-medium mr-1'}`}>
              {ellipseAddress(address, 10)}
            </div>}
          />
        </div>}
        right={routerStatus && (
          <div className="flex flex-col sm:items-end space-y-1.5">
            {/*<div className="sm:text-right">
              <div className="text-gray-400: dark:text-gray-500 text-sm">Version</div>
              <div className="font-mono text-base font-semibold mt-1 sm:mt-0">{routerStatus.routerVersion || '-'}</div>
            </div>*/}
            <div className="sm:text-right">
              <div className="text-gray-400: dark:text-gray-500 text-sm">Supported Chains</div>
              <div className="max-w-md flex flex-wrap items-center sm:justify-end mt-2 sm:mt-1">
                {routerStatus.supportedChains?.length > 0 ?
                  routerStatus.supportedChains.map((_chain_id, i) => (
                    networks.find(_network => _network?.network_id === _chain_id) && (
                      <Img
                        key={i}
                        src={networks.find(_network => _network?.network_id === _chain_id).icon}
                        alt=""
                        className="w-5 sm:w-6 h-5 sm:h-6 rounded-full mb-2 ml-0 sm:ml-2 mr-2 sm:mr-0"
                      />
                    )
                  ))
                  :
                  <span>-</span>
                }
              </div>
            </div>
          </div>
        )}
        className="flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0"
      />
      <div className="max-w-6xl my-4 mx-auto pb-2">
        <div className="grid grid-flow-row grid-cols-1 sm:grid-cols-3 xl:grid-cols-5 gap-4 mt-8">
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-base sm:text-sm lg:text-base font-normal mx-3">Router Version</div>}
          >
            <div className="mx-3">
              <div className="font-mono text-xl font-semibold mt-1">
                {routers_status_data ?
                  routerStatus?.routerVersion ?
                    routerStatus.routerVersion
                    :
                    '-'
                  :
                  <div className="skeleton w-20 h-6 mt-2" />
                }
              </div>
            </div>
          </Widget>
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-base sm:text-sm lg:text-base font-normal mx-3">Active Txs</div>}
          >
            <div className="mx-3">
              <div className="font-mono text-xl font-semibold mt-1">
                {routers_status_data ?
                  routerStatus ?
                    numberFormat(routerStatus.activeTransactionsLength, '0,0')
                    :
                    '-'
                  :
                  <div className="skeleton w-20 h-6 mt-2" />
                }
              </div>
            </div>
          </Widget>
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-base sm:text-sm lg:text-base font-normal mx-3">Processing Txs</div>}
          >
            <div className="mx-3">
              <div className="font-mono text-xl font-semibold mt-1">
                {routers_status_data ?
                  routerStatus ?
                    numberFormat(routerStatus.trackerLength, '0,0')
                    :
                    '-'
                  :
                  <div className="skeleton w-20 h-6 mt-2" />
                }
              </div>
            </div>
          </Widget>
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-base sm:text-sm lg:text-base font-normal mx-3">Volume</div>}
          >
            <div className="mx-3">
              <div className="font-mono text-xl font-semibold mt-1">
                {contracts_data && routerAssets ?
                  `${currency_symbol}${numberFormat(routerAssets.liquidity_volume, '0,0')}`
                  :
                  <div className="skeleton w-20 h-6 mt-2" />
                }
              </div>
            </div>
          </Widget>
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-base sm:text-sm lg:text-base font-normal mx-3">Transactions</div>}
          >
            <div className="mx-3">
              <div className="font-mono text-xl font-semibold mt-1">
                {contracts_data && routerAssets ?
                  numberFormat(routerAssets.total_receivingFulfillTxCount, '0,0')
                  :
                  <div className="skeleton w-20 h-6 mt-2" />
                }
              </div>
            </div>
          </Widget>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg mt-8 pt-4 pb-6 px-2 sm:px-4">
          <div className="flex items-center mx-3">
            <span className="uppercase text-gray-400 dark:text-gray-500 text-base font-light">Assets</span>
            <div className="block sm:flex items-center ml-auto">
              {typeof routerAssets?.liquidity === 'number' && routerAssets.liquidity > 0 && (
                <>
                  <div className="flex flex-col justify-end space-y-1 mb-2 sm:mb-0 mr-0 sm:mr-8">
                    <div className="whitespace-nowrap uppercase text-gray-400 dark:text-gray-500 text-2xs font-normal text-right">Available Liquidity</div>
                    <div className="font-mono sm:text-base font-semibold text-right">
                      {currency_symbol}{numberFormat(routerAssets.liquidity, '0,0')}
                    </div>
                  </div>
                  <div className="flex flex-col justify-end space-y-1 mb-2 sm:mb-0 mr-0 sm:mr-8">
                    <div className="whitespace-nowrap uppercase text-gray-400 dark:text-gray-500 text-2xs font-normal text-right">Total Liquidity</div>
                    <div className="font-mono sm:text-base font-semibold text-right">
                      {currency_symbol}{numberFormat(routerAssets.liquidity + (routerAssets.liquidity_locked || 0), '0,0')}
                    </div>
                  </div>
                  <div className="flex flex-col justify-end space-y-1 mb-2 sm:mb-0 mr-0 sm:mr-8">
                    <div className="whitespace-nowrap uppercase text-gray-400 dark:text-gray-500 text-2xs font-normal text-right">Supplied Liquidity</div>
                    <div className="font-mono sm:text-base font-semibold text-right">
                      {currency_symbol}{numberFormat(routerAssets.liquidity_supplied, '0,0')}
                    </div>
                  </div>
                  <div className="flex flex-col justify-end space-y-1">
                    <div className="whitespace-nowrap uppercase text-gray-400 dark:text-gray-500 text-2xs font-normal text-right">Removed Liquidity</div>
                    <div className="font-mono sm:text-base font-semibold text-right">
                      {currency_symbol}{numberFormat(routerAssets.liquidity_removed, '0,0')}
                    </div>
                  </div>
                  {/*typeof routerAssets?.liquidity_volume === 'number' && typeof routerAssets?.liquidity_volumeIn === 'number' && (
                    <div className="flex flex-col justify-end space-y-1 mt-2 sm:mt-0 ml-0 sm:ml-8">
                      <div className="whitespace-nowrap uppercase text-gray-400 dark:text-gray-500 text-2xs font-normal text-right">Accumulated Fees</div>
                      <div className="font-mono sm:text-base font-semibold text-right">
                        {currency_symbol}{numberFormat(routerAssets.liquidity_volumeIn - routerAssets.liquidity_volume, '0,0.00')}
                      </div>
                    </div>
                  )*/}
                </>
              )}
            </div>
          </div>
          <div className="h-3" />
          <div className="grid grid-flow-row grid-cols-2 sm:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-0 mx-1.5 md:mx-3 lg:mx-1 xl:mx-3">
            {routerAssets?.assets ?
              Object.values(routerAssets.assets).flatMap(assets => assets).map((asset, i) => (
                <div key={i}>
                  {asset?.data ?
                    <div className={`min-h-full border ${asset?.chain_data?.color?.border} p-2 sm:p-3`}>
                      <div className="space-y-0.5">
                        {asset?.data && (
                          <div className="flex">
                            {asset.data.logo_url && (
                              <Img
                                src={asset.data.logo_url}
                                alt=""
                                className="w-5 h-5 rounded-full mr-2"
                              />
                            )}
                            <div>
                              <div className="sm:hidden text-2xs font-medium">{asset.data.contract_name}</div>
                              <div className="hidden sm:block text-xs font-semibold">{asset.data.contract_name}</div>
                              {/*<div className="text-gray-600 dark:text-gray-400 text-2xs font-normal">{asset.data.contract_ticker_symbol}</div>*/}
                              {asset?.id && (
                                <div className="min-w-max flex items-center space-x-1">
                                  <Copy
                                    size={14}
                                    text={asset.id.replace(`-${routerAssets.router_id}`, '')}
                                    copyTitle={<span className="text-2xs font-medium">
                                      {ellipseAddress(asset.id.replace(`-${routerAssets.router_id}`, ''), 5)}
                                    </span>}
                                  />
                                  {asset?.chain_data?.explorer?.url && (
                                    <a
                                      href={`${asset.chain_data.explorer.url}${asset.chain_data.explorer[`contract${asset.id.includes('0x0000000000000000000000000000000000000000') ? '_0' : ''}_path`]?.replace('{address}', asset.id.replace(`-${routerAssets.router_id}`, ''))}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-600 dark:text-white "
                                    >
                                      {asset.chain_data.explorer.icon ?
                                        <img
                                          src={asset.chain_data.explorer.icon}
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
                            {asset?.chain_data?.icon && (
                              <Link href={`/${asset.chain_data.id}`}>
                                <a className="hidden sm:block min-w-max w-3 sm:w-4 h-3 sm:h-4 relative -top-2 -right-2 ml-auto">
                                  <img
                                    src={asset.chain_data.icon}
                                    alt=""
                                    className="w-3 sm:w-4 h-3 sm:h-4 rounded-full"
                                  />
                                </a>
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-center mt-3 mb-2">
                        {/*<div className="uppercase text-gray-400 dark:text-gray-500 text-2xs">Liquidity</div>*/}
                        <div>
                          <span className="font-mono text-2xs sm:text-sm lg:text-base font-semibold mr-1.5">{typeof asset?.normalize_amount === 'number' ? numberFormat(asset.normalize_amount, '0,0') : asset?.amount && !(asset?.data) ? numberFormat(asset.amount / Math.pow(10, asset?.chain_data?.currency?.decimals), '0,0') : '-'}</span>
                          <span className="text-gray-600 dark:text-gray-400 text-2xs sm:text-sm">{asset?.data?.contract_ticker_symbol}</span>
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-2xs sm:text-sm font-medium mt-1">~{currency_symbol}{typeof asset?.value === 'number' ? numberFormat(asset.value, '0,0') : ' -'}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="w-full flex flex-col items-start justify-center">
                          <div className="text-gray-400 dark:text-gray-600 text-sm">Locked In</div>
                          <div>
                            <span className="font-mono text-xs sm:text-sm font-semibold mr-1.5">{typeof asset?.normalize_lockedIn === 'number' ? numberFormat(asset.normalize_lockedIn, '0,0') : asset?.lockedIn && !(asset?.data) ? numberFormat(asset.lockedIn / Math.pow(10, asset?.chain_data?.currency?.decimals), '0,0') : '-'}</span>
                            <span className="text-gray-600 dark:text-gray-400 text-2xs sm:text-xs">{asset?.data?.contract_ticker_symbol}</span>
                          </div>
                        </div>
                        <div className="w-full flex flex-col items-end justify-center">
                          <div className="text-gray-400 dark:text-gray-600 text-sm text-right">Locked Out</div>
                          <div>
                            <span className="font-mono text-xs sm:text-sm font-semibold mr-1.5">{typeof asset?.normalize_locked === 'number' ? numberFormat(asset.normalize_locked, '0,0') : asset?.locked && !(asset?.data) ? numberFormat(asset.locked / Math.pow(10, asset?.chain_data?.currency?.decimals), '0,0') : '-'}</span>
                            <span className="text-gray-600 dark:text-gray-400 text-2xs sm:text-xs">{asset?.data?.contract_ticker_symbol}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    :
                    <div className="skeleton w-full" style={{ height: '8rem', borderRadius: 0 }} />
                  }
                </div>
              ))
              :
              [...Array(3).keys()].map(i => (
                <div key={i} className="skeleton w-full" style={{ height: '8rem', borderRadius: 0 }} />
              ))
            }
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg mt-8 pt-4 pb-6 px-2 sm:px-4">
          <div className="flex items-center mx-3">
            <span className="uppercase text-gray-400 dark:text-gray-500 text-base font-light">Available Gas</span>
          </div>
          <div className="h-3" />
          <div className="grid grid-flow-row grid-cols-2 sm:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-0 mx-1.5 md:mx-3 lg:mx-1 xl:mx-3">
            {routerGasOnChains ?
              routerGasOnChains.map((_balance, i) => (
                <div key={i}>
                  <div className={`min-h-full border ${_balance?.chain_data?.color?.border} p-2 sm:p-3`}>
                    <div className="space-y-0.5">
                      {_balance && (
                        <div className="flex">
                          {_balance.logo_url && (
                            <Img
                              src={_balance.logo_url}
                              alt=""
                              className="w-5 h-5 rounded-full mr-2"
                            />
                          )}
                          <div>
                            <div className="sm:hidden text-2xs font-medium">{_balance.contract_name}</div>
                            <div className="hidden sm:block text-xs font-semibold">{_balance.contract_name}</div>
                            {/*<div className="text-gray-600 dark:text-gray-400 text-2xs font-normal">{_balance.contract_ticker_symbol}</div>*/}
                            {/*_balance.contract_address && (
                              <div className="min-w-max flex items-center space-x-1">
                                <Copy
                                  size={14}
                                  text={_balance.contract_address}
                                  copyTitle={<span className="text-2xs font-medium">
                                    {ellipseAddress(_balance.contract_address, 5)}
                                  </span>}
                                />
                                {_balance?.chain_data?.explorer?.url && (
                                  <a
                                    href={`${_balance.chain_data.explorer.url}${_balance.chain_data.explorer[`contract${_balance.contract_address?.includes('0x0000000000000000000000000000000000000000') ? '_0' : ''}_path`]?.replace('{address}', _balance.contract_address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 dark:text-white "
                                  >
                                    {_balance.chain_data.explorer.icon ?
                                      <img
                                        src={_balance.chain_data.explorer.icon}
                                        alt=""
                                        className="w-4 h-4 rounded-full opacity-60 hover:opacity-100"
                                      />
                                      :
                                      <TiArrowRight size={16} className="transform -rotate-45" />
                                    }
                                  </a>
                                )}
                              </div>
                            )*/}
                          </div>
                          {_balance?.chain_data?.icon && (
                            <Link href={`/${_balance.chain_data.id}`}>
                              <a className="hidden sm:block min-w-max w-3 sm:w-4 h-3 sm:h-4 relative -top-2 -right-2 ml-auto">
                                <img
                                  src={_balance.chain_data.icon}
                                  alt=""
                                  className="w-3 sm:w-4 h-3 sm:h-4 rounded-full"
                                />
                              </a>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-center my-3">
                      <div className="flex items-center justify-center">
                        <span className="font-mono text-2xs sm:text-sm lg:text-base font-semibold mr-1.5">{_balance?.balance ? numberFormat(_balance.balance / Math.pow(10, _balance.contract_decimals), '0,0.00000000') : retryGas ? <Loader type="Oval" color="gray" width="16" height="16" className="mb-0.5" /> : '-'}</span>
                        <span className="text-gray-600 dark:text-gray-400 text-2xs sm:text-sm mr-1.5">{_balance?.contract_ticker_symbol}</span>
                        {_balance.chain_data?.explorer?.url && (
                          <a
                            href={`${_balance.chain_data.explorer.url}${_balance.chain_data.explorer.address_path?.replace('{address}', address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-max text-indigo-600 dark:text-white"
                          >
                            {_balance.chain_data.explorer.icon ?
                              <img
                                src={_balance.chain_data.explorer.icon}
                                alt=""
                                className="w-4 h-4 rounded-full opacity-60 hover:opacity-100"
                              />
                              :
                              <TiArrowRight size={16} className="transform -rotate-45" />
                            }
                          </a>
                        )}
                      </div>
                      {/*<div className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">~{currency_symbol}{typeof _balance?.quote === 'number' ? numberFormat(_balance.quote, '0,0') : ' -'}</div>*/}
                    </div>
                  </div>
                </div>
              ))
              :
              [...Array(routerChains?.chains?.length || 3).keys()].map(i => (
                <div key={i} className="skeleton w-full" style={{ height: '6rem', borderRadius: 0 }} />
              ))
            }
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg mt-8 py-6 px-4">
          <span className="uppercase text-gray-400 dark:text-gray-500 text-base font-light mx-3">Latest Transactions</span>
          <div className="h-3" />
          <Widget className="min-h-full contents p-0">
            <Transactions useData={(transactions && transactions.address === address && transactions) || {}} />
          </Widget>
        </div>
      </div>
    </>
  )
}