import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import { FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa'

import Transaction from '../../components/crosschain/transaction'
import SectionTitle from '../../components/section-title'
import Copy from '../../components/copy'

import { transactions as getTransactions } from '../../lib/api/subgraph'
import { contracts as getContracts } from '../../lib/api/covalent'
import { networks } from '../../lib/menus'
import { ellipseAddress } from '../../lib/utils'

import { CONTRACTS_DATA } from '../../reducers/types'

export default function CrosschainTx() {
  const dispatch = useDispatch()
  const { contracts } = useSelector(state => ({ contracts: state.contracts }), shallowEqual)
  const { contracts_data } = { ...contracts }

  const router = useRouter()
  const { query } = { ...router }
  const { tx } = { ...query }

  const [transaction, setTransaction] = useState(null)

  useEffect(() => {
    const getData = async () => {
      if (tx) {
        let data, _contracts_data = _.cloneDeep(contracts_data)

        for (let i = 0; i < networks.length; i++) {
          const network = networks[i]

          if (network && network.id && typeof network.network_id === 'number' && !network.disabled) {
            let response = await getTransactions({ chain_id: network.id }, _contracts_data, tx)

            if (response?.data?.[0]) {
              let _data = response.data[0]

              let _contracts = _.groupBy([{ id: _data.sendingAssetId, chain_id: _data.sendingChainId, data: _data.sendingAsset }, { id: _data.receivingAssetId, chain_id: _data.receivingChainId, data: _data.receivingAsset }].filter(asset => asset.id && !(asset?.data) && !(_contracts_data?.findIndex(contract => contract.id?.replace(`${networks.find(_network => _network.network_id === asset?.chain_id)?.id}-`, '') === asset.id && contract.data) > -1)), 'chain_id')

              let new_contracts

              for (let i = 0; i < Object.entries(_contracts).length; i++) {
                const contract = Object.entries(_contracts)[i]
                let [key, value] = contract
                key = Number(key)

                const resContracts = await getContracts(key, value?.map(_contract => _contract.id).join(','))

                if (resContracts?.data) {
                  new_contracts = _.uniqBy(_.concat(resContracts.data.filter(_contract => _contract).map(_contract => { return { id: _contract?.contract_address, chain_id: key, data: { ..._contract }, id: `${networks.find(_network => _network.network_id === key)?.id}-${_contract?.contract_address}` } }), new_contracts || []), 'id')
                }
              }

              new_contracts = _.uniqBy(_.concat(new_contracts || [], _contracts_data || []), 'id')

              _data = {
                ..._data,
                sendingAsset: _data.sendingAsset || new_contracts?.find(contract => contract.id?.replace(`${networks.find(_network => _network.network_id === _data.sendingChainId)?.id}-`, '') === _data.sendingAssetId && contract.data)?.data,
                receivingAsset: _data.receivingAsset || new_contracts?.find(contract => contract.id?.replace(`${networks.find(_network => _network.network_id === _data.receivingChainId)?.id}-`, '') === _data.receivingAssetId && contract.data)?.data,
              }

              _data = {
                ..._data,
                normalize_amount: ((_data.sendingChainId === network.network_id && _data.sendingAsset?.contract_decimals) || (_data.receivingChainId === network.network_id && _data.receivingAsset?.contract_decimals)) && (_data.amount / Math.pow(10, (_data.sendingChainId === network.network_id && _data.sendingAsset?.contract_decimals) || (_data.receivingChainId === network.network_id && _data.receivingAsset?.contract_decimals))),
              }

              data = {
                ...data,
                [`${_data.chainId === _data.sendingChainId ? 'sender' : 'receiver'}`]: { ..._data },
              }

              _contracts_data = new_contracts

              const next_chain = networks.find(_network => _network.network_id === (_data.chainId === _data.sendingChainId ? _data.receivingChainId : _data.sendingChainId))

              if (next_chain && next_chain.id) {
                response = await getTransactions({ chain_id: next_chain.id }, _contracts_data, tx)
              
                if (response?.data?.[0]) {
                  _data = response.data[0]

                  _contracts = _.groupBy([{ id: _data.sendingAssetId, chain_id: _data.sendingChainId, data: _data.sendingAsset }, { id: _data.receivingAssetId, chain_id: _data.receivingChainId, data: _data.receivingAsset }].filter(asset => asset.id && !(asset?.data) && !(_contracts_data?.findIndex(contract => contract.id?.replace(`${networks.find(_network => _network.network_id === asset?.chain_id)?.id}-`, '') === asset.id && contract.data) > -1)), 'chain_id')

                  new_contracts = null

                  for (let i = 0; i < Object.entries(_contracts).length; i++) {
                    const contract = Object.entries(_contracts)[i]
                    let [key, value] = contract
                    key = Number(key)

                    const resContracts = await getContracts(key, value?.map(_contract => _contract.id).join(','))

                    if (resContracts?.data) {
                      new_contracts = _.uniqBy(_.concat(resContracts.data.filter(_contract => _contract).map(_contract => { return { id: _contract?.contract_address, chain_id: key, data: { ..._contract }, id: `${networks.find(_network => _network.network_id === key)?.id}-${_contract?.contract_address}` } }), new_contracts || []), 'id')
                    }
                  }

                  new_contracts = _.uniqBy(_.concat(new_contracts || [], _contracts_data || []), 'id')

                  _data = {
                    ..._data,
                    sendingAsset: _data.sendingAsset || new_contracts?.find(contract => contract.id?.replace(`${networks.find(_network => _network.network_id === _data.sendingChainId)?.id}-`, '') === _data.sendingAssetId && contract.data)?.data,
                    receivingAsset: _data.receivingAsset || new_contracts?.find(contract => contract.id?.replace(`${networks.find(_network => _network.network_id === _data.receivingChainId)?.id}-`, '') === _data.receivingAssetId && contract.data)?.data,
                  }

                  _data = {
                    ..._data,
                    normalize_amount: ((_data.sendingChainId === next_chain.network_id && _data.sendingAsset?.contract_decimals) || (_data.receivingChainId === next_chain.network_id && _data.receivingAsset?.contract_decimals)) && (_data.amount / Math.pow(10, (_data.sendingChainId === next_chain.network_id && _data.sendingAsset?.contract_decimals) || (_data.receivingChainId === next_chain.network_id && _data.receivingAsset?.contract_decimals))),
                  }

                  data = {
                    ...data,
                    [`${_data.chainId === _data.sendingChainId ? 'sender' : 'receiver'}`]: { ..._data },
                  }

                  _contracts_data = new_contracts
                }
              }

              break
            }
          }
        }

        setTransaction({ data, tx })

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
  }, [tx])

  const status = tx && transaction?.tx === tx && ((transaction?.data && _.head(_.orderBy(Object.values(transaction.data), ['preparedTimestamp'], ['desc']))?.status) || 'Not Found')

  return (
    <>
      <SectionTitle
        title="Tx ID"
        subtitle={tx && (
          <Copy
            size={24}
            text={tx}
            copyTitle={<>
              <span className="block md:hidden uppercase text-gray-900 dark:text-gray-100 text-sm font-medium">
                {ellipseAddress(tx, 16)}
              </span>
              <span className="hidden md:block uppercase text-gray-900 dark:text-gray-100 md:text-sm xl:text-xl font-medium mr-1">
                {ellipseAddress(tx, 24)}
              </span>
            </>}
          />
        )}
        right={<div className="sm:text-right mt-1 sm:mt-0">
          <div className="uppercase text-gray-400 dark:text-gray-600 text-xs mb-1">Status</div>
          {status ?
            <div className={`min-w-max max-w-min bg-gray-200 dark:bg-${status === 'Fulfilled' ? 'green-600' : status === 'Prepared' ? 'indigo-500' : 'red-700'} rounded-lg flex items-center space-x-1 py-1 px-1.5`}>
              {status === 'Fulfilled' ?
                <FaCheckCircle size={14} className="text-green-500 dark:text-white" />
                :
                status === 'Prepared' ?
                  <FaClock size={14} className="text-gray-400 dark:text-white" />
                  :
                  <FaTimesCircle size={14} className="text-red-500 dark:text-white" />
              }
              <div className="uppercase text-gray-900 dark:text-white font-semibold">{status}</div>
            </div>
            :
            <div className="skeleton w-20 h-6" />
          }
        </div>}
        className="xl:max-w-7xl flex-col sm:flex-row items-start sm:items-center xl:my-4 mx-auto"
      />
      <div className="xl:max-w-7xl lg:my-4 xl:my-6 mx-auto">
        <Transaction data={transaction?.tx === tx && transaction} />
      </div>
    </>
  )
}