import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { BiWallet } from 'react-icons/bi'

import Balances from '../../components/crosschain/balances'
import Transactions from '../../components/crosschain/transactions'
import SectionTitle from '../../components/section-title'
import Copy from '../../components/copy'
import Widget from '../../components/widget'

import { user } from '../../lib/api/subgraph'
import { balances as getBalances, contracts as getContracts } from '../../lib/api/covalent'
import { networks } from '../../lib/menus'
import { currency_symbol } from '../../lib/object/currency'
import { numberFormat, ellipseAddress } from '../../lib/utils'

import { CONTRACTS_DATA } from '../../reducers/types'

export default function CrosschainAddress() {
  const dispatch = useDispatch()
  const { contracts, assets } = useSelector(state => ({ contracts: state.contracts, assets: state.assets }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }

  const router = useRouter()
  const { query } = { ...router }
  const { address } = { ...query }

  const [balances, setBalances] = useState(null)
  const [transactions, setTransactions] = useState(null)

  useEffect(() => {
    const getData = async () => {
      if (address) {
        let data

        for (let i = 0; i < networks.length; i++) {
          const network = networks[i]

          if (network && network.id && typeof network.network_id === 'number' && !network.disabled) {
            let page = 0
            let hasMore = true

            while (hasMore) {
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

              page++
            }
          }
        }

        setBalances({ data, address })
      }
    }

    getData()

    const interval = setInterval(() => getData(), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [address])

  useEffect(() => {
    const getData = async () => {
      if (address) {
        let data, _contracts_data = _.cloneDeep(contracts_data)

        for (let i = 0; i < networks.length; i++) {
          const network = networks[i]

          if (network && network.id && typeof network.network_id === 'number' && !network.disabled) {
            const response = await user(address, { chain_id: network.id }, _contracts_data)

            if (response) {
              const _data = response.data?.transactions || []

              const _contracts = _.groupBy(_.uniqBy(_data.flatMap(tx => [{ id: tx.sendingAssetId, chain_id: tx.sendingChainId, data: tx.sendingAsset }, { id: tx.receivingAssetId, chain_id: tx.receivingChainId, data: tx.receivingAsset }]).filter(asset => asset.id && !(asset?.data) && !(_contracts_data?.findIndex(contract => contract.id === asset.id && contract.data) > -1)), 'id'), 'chain_id')

              let new_contracts

              for (let i = 0; i < Object.entries(_contracts).length; i++) {
                const contract = Object.entries(_contracts)[i]
                const key = contract?.[0], value = contract?.[1]

                const resContracts = await getContracts(key, value?.map(_contract => _contract.id).join(','))

                if (resContracts?.data) {
                  new_contracts = _.uniqBy(_.concat(resContracts.data.filter(_contract => _contract).map(_contract => { return { id: _contract?.contract_address, chain_id: key, data: { ..._contract } } }), new_contracts || []), 'id')
                }
              }

              new_contracts = _.uniqBy(_.concat(new_contracts || [], _contracts_data || []), 'id')

              data = _.orderBy(Object.entries(_.groupBy(_.orderBy(_.concat((data || []), _data.map(tx => {
                return {
                  ...tx,
                  sendingAsset: tx.sendingAsset || new_contracts?.find(contract => contract.id === tx.sendingAssetId && contract.data)?.data,
                  receivingAsset: tx.receivingAsset || new_contracts?.find(contract => contract.id === tx.receivingAssetId && contract.data)?.data,
                }
              }).map(tx => {
                return {
                  ...tx,
                  normalize_amount: ((tx.sendingChainId === network.network_id && tx.sendingAsset?.contract_decimals) || (tx.receivingChainId === network.network_id && tx.receivingAsset?.contract_decimals)) && (tx.amount / Math.pow(10, (tx.sendingChainId === network.network_id && tx.sendingAsset?.contract_decimals) || (tx.receivingChainId === network.network_id && tx.receivingAsset?.contract_decimals))),
                }
              })), ['preparedTimestamp'], ['desc']), 'id')).map(([key, value]) => { return { txs: _.orderBy(value, ['preparedTimestamp'], ['asc']).map(tx => { return { id: tx.chainTx, chain_id: tx.chainId } }), ...(_.maxBy(value, 'preparedTimestamp')) } }), ['preparedTimestamp'], ['desc'])

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

    const interval = setInterval(() => getData(), 15 * 1000)
    return () => clearInterval(interval)
  }, [address])

  return (
    <>
      <SectionTitle
        title="Address"
        subtitle={<Copy
          size={24}
          text={address}
          copyTitle={<span className="uppercase text-gray-900 dark:text-gray-100 font-medium mr-1">
            {ellipseAddress(address, 10)}
          </span>}
        />}
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