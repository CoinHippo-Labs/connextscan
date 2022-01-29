import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'
import moment from 'moment'
import Web3 from 'web3'
import { utils } from 'ethers'
import { Img } from 'react-image'
import { TiArrowRight } from 'react-icons/ti'
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import { MdPending } from 'react-icons/md'

import Datatable from '../datatable'
import Copy from '../copy'
import Popover from '../popover'

import { transactions as getTransactions } from '../../lib/api/subgraph'
import { contracts as getContracts } from '../../lib/api/covalent'
import { networks } from '../../lib/menus'
import { numberFormat, ellipseAddress } from '../../lib/utils'

import { CONTRACTS_DATA } from '../../reducers/types'

export default function Transactions({ className = '' }) {
  const dispatch = useDispatch()
  const { contracts } = useSelector(state => ({ contracts: state.contracts }), shallowEqual)
  const { contracts_data } = { ...contracts }

  const router = useRouter()
  const { pathname, query } = { ...router }
  const { chain_id } = { ...query }
  const network = networks[networks.findIndex(network => network.id === chain_id)] || (pathname.startsWith('/[chain_id]') ? null : networks[0])

  const [transactions, setTransactions] = useState(null)

  const [web3, setWeb3] = useState(null)
  const [chainId, setChainId] = useState(null)

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
    const controller = new AbortController()

    const getData = async () => {
      if (network) {
        if (!controller.signal.aborted) {
          const response = await getTransactions({ chain_id: network.id }, contracts_data)

          if (response) {
            let data = response.data || []

            const _contracts = _.groupBy(_.uniqBy(data.flatMap(tx => [{ id: tx.sendingAssetId, chain_id: tx.sendingChainId, data: tx.sendingAsset }, { id: tx.receivingAssetId, chain_id: tx.receivingChainId, data: tx.receivingAsset }]).filter(asset => asset.id && !(asset?.data) && !(contracts_data?.findIndex(contract => contract.id?.replace(`${networks.find(_network => _network.network_id === asset?.chain_id)?.id}-`, '') === asset.id && contract.data) > -1)).map(asset => { return { ...asset, _id: `${networks.find(_network => _network.network_id === asset?.chain_id)?.id}-${asset?.id}` } }), '_id'), 'chain_id')

            let new_contracts

            for (let i = 0; i < Object.entries(_contracts).length; i++) {
              if (!controller.signal.aborted) {
                const contract = Object.entries(_contracts)[i]
                let [key, value] = contract
                key = Number(key)

                const resContracts = await getContracts(key, value?.map(_contract => _contract.id).join(','))

                if (resContracts?.data) {
                  new_contracts = _.uniqBy(_.concat(resContracts.data.filter(_contract => _contract).map(_contract => { return { id: _contract?.contract_address, chain_id: key, data: { ..._contract }, id: `${networks.find(_network => _network.network_id === key)?.id}-${_contract?.contract_address}` } }), new_contracts || []), 'id')
                }
              }
            }

            new_contracts = _.uniqBy(_.concat(new_contracts || [], contracts_data || []), 'id')

            data = data.map(tx => {
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
            })

            setTransactions({ data, chain_id })

            if (!controller.signal.aborted) {
              if (new_contracts) {
                dispatch({
                  type: CONTRACTS_DATA,
                  value: new_contracts,
                })
              }
            }
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
  }, [network])

  const addTokenToMetaMask = async (chain_id, contract) => {
    if (web3 && contract) {
      if (chain_id === chainId) {
        try {
          const image = _.head(contract.logo_url || [])

          const response = await web3.currentProvider.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC20',
              options: {
                address: contract.contract_address,
                symbol: contract.contract_ticker_symbol,
                decimals: contract.contract_decimals,
                image: `${image?.startsWith('/') ? process.env.NEXT_PUBLIC_SITE_URL : ''}${image}`,
              },
            },
          })
        } catch (error) {}
      }
      else {
        switchNetwork(chain_id)
      }
    }
  }

  const switchNetwork = async chain_id => {
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
            params: networks?.find(c => c.network_id === chain_id)?.provider_params,
          })
        } catch (error) {
          console.log(error)
        }
      }
    }
  }

  return (
    <>
      <Datatable
        columns={[
          {
            Header: 'TX ID',
            accessor: 'transactionId',
            disableSortBy: true,
            Cell: props => (
              !props.row.original.skeleton ?
                <>
                  <div className="flex items-center space-x-1">
                    <Link href={`/tx/${props.value}`}>
                      <a className="uppercase text-indigo-600 dark:text-white font-medium">
                        {ellipseAddress(props.value, 6)}
                      </a>
                    </Link>
                    <Copy text={props.value} />
                  </div>
                  {props.row.original.chainTx && network?.explorer?.url && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Copy
                        size={12}
                        text={props.row.original.chainTx}
                        copyTitle={<span className="text-gray-400 dark:text-gray-600 text-xs font-light">
                          {ellipseAddress(props.row.original.chainTx, 6)}
                        </span>}
                      />
                      <a
                        href={`${network.explorer.url}${network.explorer.transaction_path?.replace('{tx}', props.row.original.chainTx)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-white"
                      >
                        {network?.explorer?.icon ?
                          <img
                            src={network.explorer.icon}
                            alt=""
                            className="w-4 h-4 rounded-full opacity-60 hover:opacity-100"
                          />
                          :
                          <TiArrowRight size={16} className="transform -rotate-45" />
                        }
                      </a>
                    </div>
                  )}
                </>
                :
                <>
                  <div className="skeleton w-32 h-4" />
                  <div className="skeleton w-24 h-3 mt-3" />
                </>
            ),
          },
          {
            Header: 'Status',
            accessor: 'status',
            disableSortBy: true,
            Cell: props => (
              !props.row.original.skeleton ?
                <Link href={`/tx/${props.row.original.transactionId}`}>
                  <a className={`max-w-min h-6 bg-gray-100 dark:bg-${props.value === 'Fulfilled' ? 'green-600' : props.value === 'Prepared' ? 'yellow-500' : 'red-700'} rounded-lg flex items-center space-x-1 py-1 px-1.5`}>
                    {props.value === 'Fulfilled' ?
                      <FaCheckCircle size={14} className="text-green-500 dark:text-white" />
                      :
                      props.value === 'Prepared' ?
                        <MdPending size={14} className="text-yellow-500 dark:text-white" />
                        :
                        <FaTimesCircle size={14} className="text-red-500 dark:text-white" />
                    }
                    <div className="uppercase text-gray-900 dark:text-white text-xs font-semibold">{props.value}</div>
                  </a>
                </Link>
                :
                <div className="skeleton w-20 h-6" />
            ),
          },
          {
            Header: 'Initiator',
            accessor: 'sendingAddress',
            disableSortBy: true,
            Cell: props => (
              !props.row.original.skeleton ?
                props.value ?
                  <div className="min-w-max">
                    <div className="flex items-center space-x-1">
                      <Link href={`/address/${props.value}`}>
                        <a className="uppercase text-indigo-600 dark:text-white text-xs font-medium">
                          {ellipseAddress(props.value, 6)}
                        </a>
                      </Link>
                      <Copy text={props.value} />
                      {props.row.original.sendingChain?.explorer?.url && (
                        <a
                          href={`${props.row.original.sendingChain.explorer.url}${props.row.original.sendingChain.explorer.address_path?.replace('{address}', props.value)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-white"
                        >
                          {props.row.original.sendingChain.explorer.icon ?
                            <img
                              src={props.row.original.sendingChain.explorer.icon}
                              alt=""
                              className="w-4 h-4 rounded-full opacity-60 hover:opacity-100"
                            />
                            :
                            <TiArrowRight size={16} className="transform -rotate-45" />
                          }
                        </a>
                      )}
                    </div>
                    {props.row.original.sendingChain && (
                      <div className="flex items-center space-x-1.5 mt-1">
                        {props.row.original.sendingChain.icon && (
                          <img
                            src={props.row.original.sendingChain.icon}
                            alt=""
                            className="w-4 h-4 rounded-full"
                          />
                        )}
                        <span className="text-gray-700 dark:text-gray-300 text-2xs">{props.row.original.sendingChain.short_name || props.row.original.sendingChain.title}</span>
                      </div>
                    )}
                  </div>
                  :
                  <span className="text-gray-400 dark:text-gray-600 font-light">Unknown</span>
                :
                <>
                  <div className="skeleton w-24 h-4" />
                  <div className="skeleton w-16 h-3 mt-3" />
                </>
            ),
          },
          {
            Header: 'Receiver',
            accessor: 'receivingAddress',
            disableSortBy: true,
            Cell: props => (
              !props.row.original.skeleton ?
                props.value ?
                  <div className="min-w-max">
                    <div className="flex items-center space-x-1">
                      <Link href={`/address/${props.value}`}>
                        <a className="uppercase text-indigo-600 dark:text-white text-xs font-medium">
                          {ellipseAddress(props.value, 6)}
                        </a>
                      </Link>
                      <Copy text={props.value} />
                      {props.row.original.receivingChain?.explorer?.url && (
                        <a
                          href={`${props.row.original.receivingChain.explorer.url}${props.row.original.receivingChain.explorer.address_path?.replace('{address}', props.value)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-white"
                        >
                          {props.row.original.receivingChain.explorer.icon ?
                            <img
                              src={props.row.original.receivingChain.explorer.icon}
                              alt=""
                              className="w-4 h-4 rounded-full opacity-60 hover:opacity-100"
                            />
                            :
                            <TiArrowRight size={16} className="transform -rotate-45" />
                          }
                        </a>
                      )}
                    </div>
                    {props.row.original.receivingChain && (
                      <div className="flex items-center space-x-1.5 mt-1">
                        {props.row.original.receivingChain.icon && (
                          <img
                            src={props.row.original.receivingChain.icon}
                            alt=""
                            className="w-4 h-4 rounded-full"
                          />
                        )}
                        <span className="text-gray-700 dark:text-gray-300 text-2xs">{props.row.original.receivingChain.short_name || props.row.original.receivingChain.title}</span>
                      </div>
                    )}
                  </div>
                  :
                  <span className="text-gray-400 dark:text-gray-600 font-light">Unknown</span>
                :
                <>
                  <div className="skeleton w-24 h-4" />
                  <div className="skeleton w-16 h-3 mt-3" />
                </>
            ),
          },
          {
            Header: 'Asset',
            accessor: 'normalize_amount',
            disableSortBy: true,
            Cell: props => {
              const addToMetaMaskButton = (
                <button
                  onClick={() => addTokenToMetaMask(props.row.original?.receivingChainId, { ...props.row.original?.receivingAsset })}
                  className="w-auto bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center py-1.5 px-2"
                >
                  <Img
                    src="/logos/wallets/metamask.png"
                    alt=""
                    className="w-4 h-4"
                  />
                </button>
              )

              return !props.row.original.skeleton ?
                <>
                  <div className="flex flex-row items-center justify-end space-x-2">
                    {props.row.original.sendingAssetId ?
                      <div className="flex flex-col">
                        {props.row.original.sendingAsset && (
                          <a
                            href={`${props.row.original.sendingChain?.explorer?.url}${props.row.original.sendingChain?.explorer?.[`contract${props.row.original.sendingAssetId?.includes('0x0000000000000000000000000000000000000000') ? '_0' : ''}_path`]?.replace('{address}', props.row.original.sendingAssetId)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1.5"
                          >
                            {props.row.original.sendingAsset.logo_url && (
                              <Img
                                src={props.row.original.sendingAsset.logo_url}
                                alt=""
                                className="w-5 h-5 rounded-full"
                              />
                            )}
                            <span className="h-5 text-xs font-medium">{props.row.original.sendingAsset.contract_ticker_symbol || props.row.original.sendingAsset.contract_name}</span>
                          </a>
                        )}
                        <div className="flex items-center space-x-1">
                          <Copy
                            size={12}
                            text={props.row.original.sendingAssetId}
                            copyTitle={<span className="text-gray-400 dark:text-gray-200 text-2xs font-medium">
                              {ellipseAddress(props.row.original.sendingAssetId, 6)}
                            </span>}
                          />
                          {!props.row.original.sendingAsset && props.row.original.sendingChain?.explorer?.url && (
                            <a
                              href={`${props.row.original.sendingChain.explorer.url}${props.row.original.sendingChain.explorer[`contract${props.row.original.sendingAssetId?.includes('0x0000000000000000000000000000000000000000') ? '_0' : ''}_path`]?.replace('{address}', props.row.original.sendingAssetId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 dark:text-white"
                            >
                              {props.row.original.sendingChain.explorer.icon ?
                                <img
                                  src={props.row.original.sendingChain.explorer.icon}
                                  alt=""
                                  className="w-4 h-4 rounded-full opacity-60 hover:opacity-100"
                                />
                                :
                                <TiArrowRight size={16} className="transform -rotate-45" />
                              }
                            </a>
                          )}
                        </div>
                      </div>
                      :
                      <span className="text-gray-400 dark:text-gray-600 font-light">-</span>
                    }
                    <TiArrowRight size={18} />
                    {props.row.original.receivingAssetId ?
                      <div className="flex flex-col">
                        {props.row.original.receivingAsset && (
                          <div className="flex items-center space-x-2">
                            <a
                              href={`${props.row.original.receivingChain?.explorer?.url}${props.row.original.receivingChain?.explorer?.[`contract${props.row.original.receivingAssetId?.includes('0x0000000000000000000000000000000000000000') ? '_0' : ''}_path`]?.replace('{address}', props.row.original.receivingAssetId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1.5"
                            >
                              {props.row.original.receivingAsset.logo_url && (
                                <Img
                                  src={props.row.original.receivingAsset.logo_url}
                                  alt=""
                                  className="w-5 h-5 rounded-full"
                                />
                              )}
                              <span className="h-5 text-xs font-medium">{props.row.original.receivingAsset.contract_ticker_symbol || props.row.original.receivingAsset.contract_name}</span>
                            </a>
                            {props.row.original.receivingChainId === chainId ?
                              <Popover
                                placement="top"
                                title={<span className="normal-case text-xs">Add token</span>}
                                content={<div className="w-36 text-xs">Add <span className="font-semibold">{props.row.original.receivingAsset.contract_ticker_symbol}</span> to MetaMask</div>}
                              >
                                {addToMetaMaskButton}
                              </Popover>
                              :
                              <Popover
                                placement="top"
                                title={<span className="normal-case text-xs">Change wallet network</span>}
                                content={<div className="w-40 text-xs">Click to switch your wallet network to <span className="font-semibold">{props.row.original.receivingChain?.title}</span>.</div>}
                              >
                                {addToMetaMaskButton}
                              </Popover>
                            }
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Copy
                            size={12}
                            text={props.row.original.receivingAssetId}
                            copyTitle={<span className="text-gray-400 dark:text-gray-200 text-2xs font-medium">
                              {ellipseAddress(props.row.original.receivingAssetId, 6)}
                            </span>}
                          />
                          {!props.row.original.receivingAsset && props.row.original.receivingChain?.explorer?.url && (
                            <a
                              href={`${props.row.original.receivingChain.explorer.url}${props.row.original.receivingChain.explorer[`contract${props.row.original.receivingAssetId?.includes('0x0000000000000000000000000000000000000000') ? '_0' : ''}_path`]?.replace('{address}', props.row.original.receivingAssetId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 dark:text-white"
                            >
                              {props.row.original.receivingChain.explorer.icon ?
                                <img
                                  src={props.row.original.receivingChain.explorer.icon}
                                  alt=""
                                  className="w-4 h-4 rounded-full opacity-60 hover:opacity-100"
                                />
                                :
                                <TiArrowRight size={16} className="transform -rotate-45" />
                              }
                            </a>
                          )}
                        </div>
                      </div>
                      :
                      <span className="text-gray-400 dark:text-gray-600 font-light">-</span>
                    }
                  </div>
                  {props.value && (
                    <div className="max-w-min bg-gray-100 dark:bg-gray-800 rounded text-xs space-x-1 mt-1.5 mb-1 ml-auto py-0.5 px-1.5">
                      <span className="font-semibold">{numberFormat(props.value, '0,0.00000000', true)}</span>
                      <span className="uppercase text-gray-600 dark:text-gray-400">{props.row.original.sendingAsset?.contract_ticker_symbol || props.row.original.receivingAsset?.contract_ticker_symbol}</span>
                    </div>
                  )}
                </>
                :
                <>
                  <div className="skeleton w-32 h-4 ml-auto" />
                  <div className="skeleton w-24 h-3 mt-3 ml-auto" />
                </>
            },
            headerClassName: 'justify-end text-right',
          },
          {
            Header: 'Time',
            accessor: 'preparedTimestamp',
            disableSortBy: true,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="text-right">
                  <span className="text-gray-400 dark:text-gray-600">
                    {Number(moment().diff(moment(props.value), 'second')) > 59 ?
                      moment(props.value).fromNow()
                      :
                      <>{moment().diff(moment(props.value), 'second')}s ago</>
                    }
                  </span>
                </div>
                :
                <div className="skeleton w-20 h-4 ml-auto" />
            ),
            headerClassName: 'justify-end text-right',
          },
        ]}
        data={transactions?.chain_id === chain_id ?
          (transactions?.data || []).map((transaction, i) => { return { ...transaction, i } })
          :
          [...Array(10).keys()].map(i => { return { i, skeleton: true } })
        }
        noPagination={!transactions || transactions.data?.length <= 10 ? true : false}
        defaultPageSize={10}
        className={`min-h-full ${className}`}
      />
      {transactions && transactions.chain_id === chain_id && !(transactions.data?.length > 0) && (
        <div className="bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-500 text-base font-medium italic text-center my-4 py-2">
          No Transactions
        </div>
      )}
    </>
  )
}