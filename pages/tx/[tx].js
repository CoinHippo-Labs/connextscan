import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import Loader from 'react-loader-spinner'
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import { MdPending } from 'react-icons/md'

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
  const { preferences, contracts } = useSelector(state => ({ preferences: state.preferences, contracts: state.contracts }), shallowEqual)
  const { theme } = { ...preferences }
  const { contracts_data } = { ...contracts }

  const router = useRouter()
  const { query } = { ...router }
  const { tx } = { ...query }

  const [transaction, setTransaction] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    const getData = async () => {
      if (tx) {
        let data, _contracts_data = _.cloneDeep(contracts_data)

        for (let i = 0; i < networks.length; i++) {
          if (!controller.signal.aborted) {
            const network = networks[i]

            if (network && network.id && typeof network.network_id === 'number' && !network.disabled) {
              let response

              if (!controller.signal.aborted) {
                response = await getTransactions({ chain_id: network.id }, _contracts_data, tx)

                if (response?.data?.[0]) {
                  let _data = response.data[0]

                  let _contracts = _.groupBy([{ id: _data.sendingAssetId, chain_id: _data.sendingChainId, data: _data.sendingAsset }, { id: _data.receivingAssetId, chain_id: _data.receivingChainId, data: _data.receivingAsset }].filter(asset => asset.id && !(asset?.data) && !(_contracts_data?.findIndex(contract => contract.id?.replace(`${networks.find(_network => _network.network_id === asset?.chain_id)?.id}-`, '') === asset.id && contract.data) > -1)), 'chain_id')

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

                  if (!controller.signal.aborted) {
                    if (next_chain && next_chain.id) {
                      response = await getTransactions({ chain_id: next_chain.id }, _contracts_data, tx)
                    
                      if (response?.data?.[0]) {
                        _data = response.data[0]

                        _contracts = _.groupBy([{ id: _data.sendingAssetId, chain_id: _data.sendingChainId, data: _data.sendingAsset }, { id: _data.receivingAssetId, chain_id: _data.receivingChainId, data: _data.receivingAsset }].filter(asset => asset.id && !(asset?.data) && !(_contracts_data?.findIndex(contract => contract.id?.replace(`${networks.find(_network => _network.network_id === asset?.chain_id)?.id}-`, '') === asset.id && contract.data) > -1)), 'chain_id')

                        new_contracts = null

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
                  }

                  break
                }
              }
            }
          }
        }

        setTransaction({ data, tx })

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

    const interval = setInterval(() => getData(), 15 * 1000)
    return () => {
      controller?.abort()
      clearInterval(interval)
    }
  }, [tx])

  const status = tx && transaction?.tx === tx && ((transaction?.data && _.head(_.orderBy(Object.values(transaction.data), ['order', 'preparedTimestamp'], ['desc', 'desc']))?.status) || 'Not Found')

  let tip

  if (status === 'Prepared') {
    if (transaction?.data && (Object.keys(transaction.data).length > 1 || transaction.data.receiver)) {
      tip = (
        <div className="flex items-center justify-end text-xs space-x-1.5 mt-1">
          <span className="text-blue-600 dark:text-blue-400 font-semibold">Ready to Claim / Cancel</span>
          <Loader type="Puff" color={theme === 'dark' ? '#60A5FA' : '#3B82F6'} width="16" height="16" />
        </div>
      )
    }
    else {
      tip = (
        <span className="flex items-center justify-end text-xs space-x-1.5 mt-1">
          <span className="text-blue-600 dark:text-blue-400 font-semibold">Processing</span>
          <Loader type="ThreeDots" color={theme === 'dark' ? '#60A5FA' : '#3B82F6'} width="16" height="16" className="mt-1" />
        </span>
      )
    }
  }
  else if (status === 'Not Found') {
    tip = (
      <div className="flex items-center justify-end text-xs space-x-1.5 mt-1">
        <span className="text-blue-600 dark:text-blue-400 font-semibold">Maybe Subgraph Unsynced</span>
        <Loader type="Grid" color={theme === 'dark' ? '#60A5FA' : '#3B82F6'} width="16" height="16" />
      </div>
    )
  }

  return (
    <>
      <SectionTitle
        title="TX ID"
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
          <div className="uppercase text-gray-400 dark:text-gray-400 text-xs mb-1.5">Status</div>
          {status ?
            <div className={`min-w-max max-w-min bg-gray-200 dark:bg-${status === 'Fulfilled' ? 'green-600' : status === 'Prepared' ? 'yellow-500' : 'red-700'} rounded-lg flex items-center space-x-1 sm:ml-auto py-1 px-1.5`}>
              {status === 'Fulfilled' ?
                <FaCheckCircle size={14} className="text-green-500 dark:text-white" />
                :
                status === 'Prepared' ?
                  <MdPending size={14} className="text-yellow-500 dark:text-white" />
                  :
                  <FaTimesCircle size={14} className="text-red-500 dark:text-white" />
              }
              <div className="uppercase text-gray-900 dark:text-white font-semibold">{status}</div>
            </div>
            :
            <div className="skeleton w-24 h-7" />
          }
          {tip}
        </div>}
        className="xl:max-w-7xl flex-col sm:flex-row items-start sm:items-center xl:my-4 mx-auto"
      />
      <div className="xl:max-w-7xl lg:my-4 xl:my-6 mx-auto">
        <Transaction data={transaction?.tx === tx && transaction} />
      </div>
    </>
  )
}