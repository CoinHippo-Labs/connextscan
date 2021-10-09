import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'

import Transactions from '../../components/crosschain/transactions'
import SectionTitle from '../../components/section-title'
import Copy from '../../components/copy'
import Widget from '../../components/widget'

import { user } from '../../lib/api/subgraph'
import { contracts as getContracts } from '../../lib/api/covalent'
import { networks } from '../../lib/menus'
import { currency_symbol } from '../../lib/object/currency'
import { ellipseAddress } from '../../lib/utils'

import { CONTRACTS_DATA } from '../../reducers/types'

export default function CrosschainAddress() {
  const dispatch = useDispatch()
  const { contracts } = useSelector(state => ({ contracts: state.contracts }), shallowEqual)
  const { contracts_data } = { ...contracts }

  const router = useRouter()
  const { query } = { ...router }
  const { address } = { ...query }

  const [transactions, setTransactions] = useState(null)

  useEffect(() => {
    const getData = async () => {
      if (address) {
        let data, _contracts_data = _.cloneDeep(contracts_data)

        for (let i = 0; i < networks.length; i++) {
          const network = networks[i]

          if (network && network.id) {
            const response = await user(address, { chain_id: network.id }, _contracts_data)

            if (response) {
              let _data = response.data?.transactions || []

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

    const interval = setInterval(() => getData(), 30 * 1000)
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
        <div>
          <div className="flex flex-col sm:flex-row sm:items-start space-y-3">
            <span className="uppercase text-gray-900 dark:text-white text-lg font-semibold mt-3">Balances</span>
            <span className="sm:text-right mb-auto ml-0 sm:ml-auto">
              <div className="h-full uppercase text-gray-400 dark:text-gray-500">Total</div>
              {/*address && routers?.address === address ?
                <div className="font-mono text-xl font-semibold">
                  {currency_symbol}
                  {routers?.data?.findIndex(router => router?.assetBalances?.findIndex(assetBalance => typeof assetBalance?.value === 'number') > -1) > -1 ?
                    numberFormat(_.sum(routers.data.flatMap(router => router?.assetBalances?.map(assetBalance => assetBalance?.value) || [])), '0,0')
                    :
                    '-'
                  }
                </div>
                :
                <div className="skeleton w-28 h-7 mt-1 sm:ml-auto" />
              */}
            </span>
          </div>
          {/*<Assets data={routers} className="mt-4" />*/}
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