import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { Img } from 'react-image'
import { BiWallet } from 'react-icons/bi'

import Balances from '../../components/crosschain/balances'
import Transactions from '../../components/crosschain/transactions'
import SectionTitle from '../../components/section-title'
import Copy from '../../components/copy'
import Widget from '../../components/widget'

import { user } from '../../lib/api/subgraph'
import { balances as getBalances, contracts as getContracts } from '../../lib/api/covalent'
import { domains, getENS } from '../../lib/api/ens'
import { networks } from '../../lib/menus'
import { currency_symbol } from '../../lib/object/currency'
import { numberFormat, ellipseAddress } from '../../lib/utils'

import { CONTRACTS_DATA, ENS_DATA } from '../../reducers/types'

export default function CrosschainAddress() {
  const dispatch = useDispatch()
  const { contracts, assets, ens } = useSelector(state => ({ contracts: state.contracts, assets: state.assets, ens: state.ens }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }
  const { ens_data } = { ...ens }

  const router = useRouter()
  const { query } = { ...router }
  const { address } = { ...query }

  const [routerIds, setRouterIds] = useState(null)
  const [balances, setBalances] = useState(null)
  const [transactions, setTransactions] = useState(null)

  useEffect(() => {
    if (assets_data) {
      setRouterIds(_.uniq(Object.values(assets_data).flatMap(_assets => _assets?.map(_asset => _asset?.router?.id).filter(router_id => router_id) || [])))
    }
  }, [assets_data])

  useEffect(async () => {
    if (address) {
      if (routerIds?.includes(address.toLowerCase())) {
        router.push(`/router/${address}`)
      }
      else {
        const response = await domains({ where: `{ resolvedAddress_in: ["${address.toLowerCase()}"] }` })

        const ensData = response?.data || []

        if (ensData?.length > 0) {
          let ensResponse

          if (ensData.length > 1) {
            ensResponse = await getENS(address)
          }

          dispatch({
            type: ENS_DATA,
            value: Object.fromEntries(ensData.filter(domain => !ensResponse?.reverseRecord || domain?.name === ensResponse.reverseRecord).map(domain => [domain?.resolvedAddress?.id?.toLowerCase(), { ...domain }])),
          })
        }
      }
    }
  }, [address, routerIds])

  useEffect(() => {
    const controller = new AbortController()

    const getData = async isInterval => {
      if (address && (isInterval || (routerIds && !routerIds.includes(address.toLowerCase())))) {
        let data

        for (let i = 0; i < networks.length; i++) {
          if (!controller.signal.aborted) {
            const network = networks[i]

            if (network && network.id && typeof network.network_id === 'number' && !network.disabled) {
              let page = 0
              let hasMore = true

              while (hasMore) {
                if (!controller.signal.aborted) {
                  const response = await getBalances(network.network_id, address, { 'page-number': page })

                  if (response?.data) {
                    data = (
                      _.orderBy(
                        _.uniqBy(_.concat(data || [], response.data.items || []), 'contract_address')
                        .map(balance => {
                          return {
                            ...balance,
                            balance: typeof balance.balance === 'string' ? Number(balance.balance) : typeof balance.balance === 'number' ? balance.balance : -1,
                            quote_rate: typeof balance.quote_rate === 'string' ? Number(balance.quote_rate) : typeof balance.quote_rate === 'number' ? balance.quote_rate : -1,
                            quote: typeof balance.quote === 'string' ? Number(balance.quote) : typeof balance.quote === 'number' ? balance.quote : -1,
                            chain_data: balance.chain_data || network,
                          }
                        }),
                        ['quote'], ['desc']
                      )
                    )

                    hasMore = response.data.pagination?.has_more
                  }
                  else {
                    hasMore = false
                  }
                }
                else {
                  hasMore = false
                }

                page++
              }
            }
          }
        }

        setBalances({ data, address })
      }
    }

    getData()

    const interval = setInterval(() => getData(true), 10 * 60 * 1000)
    return () => {
      controller?.abort()
      clearInterval(interval)
    }
  }, [address, routerIds])

  useEffect(() => {
    const controller = new AbortController()

    const getData = async isInterval => {
      if (address && (isInterval || (routerIds && !routerIds.includes(address.toLowerCase())))) {
        let data, allTransactions, _contracts_data = _.cloneDeep(contracts_data)

        for (let i = 0; i < networks.length; i++) {
          const network = networks[i]

          if (network && network.id && typeof network.network_id === 'number' && !network.disabled) {
            const response = await user(address, { chain_id: network.network_id }, _contracts_data)

            if (response) {
              const _data = response.data?.transactions || []

              const _contracts = _.groupBy(_.uniqBy(_data.flatMap(tx => [{ id: tx.sendingAssetId, chain_id: tx.sendingChainId, data: tx.sendingAsset }, { id: tx.receivingAssetId, chain_id: tx.receivingChainId, data: tx.receivingAsset }]).filter(asset => asset.id && !(asset?.data) && !(_contracts_data?.findIndex(contract => contract.id?.replace(`${networks.find(_network => _network.network_id === asset?.chain_id)?.id}-`, '') === asset.id && contract.data) > -1)).map(asset => { return { ...asset, _id: `${networks.find(_network => _network.network_id === asset?.chain_id)?.id}-${asset?.id}` } }), '_id'), 'chain_id')

              let new_contracts

              for (let j = 0; j < Object.entries(_contracts).length; j++) {
                const contract = Object.entries(_contracts)[j]
                let [key, value] = contract
                key = Number(key)

                const resContracts = await getContracts(key, value?.map(_contract => _contract.id).join(','))

                if (resContracts?.data) {
                  new_contracts = _.uniqBy(_.concat(resContracts.data.filter(_contract => _contract).map(_contract => { return { id: _contract?.contract_address, chain_id: key, data: { ..._contract }, id: `${networks.find(_network => _network.network_id === key)?.id}-${_contract?.contract_address}` } }), new_contracts || []), 'id')
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
            }
          }
        }

        setTransactions({ data, address })

        if (_contracts_data) {
          dispatch({
            type: CONTRACTS_DATA,
            value: _contracts_data,
          })
        }
      }
    }

    getData()

    const interval = setInterval(() => getData(true), 1 * 60 * 1000)
    return () => {
      controller?.abort()
      clearInterval(interval)
    }
  }, [address, routerIds])

  return (
    <>
      <SectionTitle
        title="Address"
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
        className="flex-col sm:flex-row items-start sm:items-center"
      />
      <div className="max-w-6xl my-4 mx-auto pb-2">
        <div className="bg-white dark:bg-gray-900 rounded-lg mt-8 pt-3 pb-6 px-4">
          <div className="flex flex-col sm:flex-row sm:items-start space-y-3 mx-3">
            <span className="flex items-center uppercase text-gray-900 dark:text-white text-lg font-semibold space-x-1.5 mt-3">
              <BiWallet size={24} />
              <span>Balances</span>
            </span>
            <span className="sm:text-right mb-auto ml-0 sm:ml-auto">
              <div className="h-full uppercase text-gray-400 dark:text-gray-500">Total</div>
              {address && balances?.address === address && assets_data ?
                <div className="font-mono text-xl font-semibold">
                  {currency_symbol}
                  {balances?.data?.filter(balance => Object.entries(assets_data).findIndex(([key, value]) => value.findIndex(asset => asset.contract_address === balance.contract_address) > -1) > -1).findIndex(balance => balance?.quote > 0) > -1 ?
                    numberFormat(_.sumBy(balances.data.filter(balance => Object.entries(assets_data).findIndex(([key, value]) => value.findIndex(asset => asset.contract_address === balance.contract_address) > -1) > -1), 'quote'), '0,0')
                    :
                    '-'
                  }
                </div>
                :
                <div className="skeleton w-20 h-6 mt-1 sm:ml-auto" />
              }
            </span>
          </div>
          <div className="h-3" />
          <Widget className="min-h-full contents p-0">
            <Balances data={assets_data && balances && { ...balances, data: balances.data?.filter(balance => Object.entries(assets_data).findIndex(([key, value]) => value.findIndex(asset => asset.contract_address === balance.contract_address) > -1) > -1) }} />
          </Widget>
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