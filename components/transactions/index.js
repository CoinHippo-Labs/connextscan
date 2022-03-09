import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'
import moment from 'moment'
import Web3 from 'web3'
import { constants, utils } from 'ethers'
import BigNumber from 'bignumber.js'
import { Img } from 'react-image'
import { Puff, TailSpin } from 'react-loader-spinner'
import { TiArrowRight } from 'react-icons/ti'
import { FaCheckCircle, FaRegCheckCircle, FaTimesCircle } from 'react-icons/fa'
import { GoCode } from 'react-icons/go'

import Datatable from '../datatable'
import Copy from '../copy'
import Popover from '../popover'

import { transactions as getTransactions } from '../../lib/api/subgraph'
import { domains, getENS } from '../../lib/api/ens'
import { chainTitle } from '../../lib/object/chain'
import { numberFormat, ellipseAddress } from '../../lib/utils'

import { ENS_DATA, TRANSACTIONS_DATA } from '../../reducers/types'

const filter_statuses = [
  { status: 'Preparing', color: 'blue' },
  { status: 'Prepared', color: 'yellow' },
  { status: 'Fulfilling', color: 'green' },
  { status: 'Fulfilled', color: 'green' },
  { status: 'Cancelled', color: 'red' },
]

BigNumber.config({ DECIMAL_PLACES: Number(process.env.NEXT_PUBLIC_MAX_BIGNUMBER_EXPONENTIAL_AT), EXPONENTIAL_AT: [-7, Number(process.env.NEXT_PUBLIC_MAX_BIGNUMBER_EXPONENTIAL_AT)] })

export default function Transactions({ addTokenToMetaMaskFunction, className = '' }) {
  const dispatch = useDispatch()
  const { preferences, chains, tokens, ens, transactions, sdk } = useSelector(state => ({ preferences: state.preferences, chains: state.chains, tokens: state.tokens, ens: state.ens, transactions: state.transactions, sdk: state.sdk }), shallowEqual)
  const { theme } = { ...preferences }
  const { chains_data } = { ...chains }
  const { tokens_data } = { ...tokens }
  const { ens_data } = { ...ens }
  const { transactions_data } = { ...transactions }
  const { sdk_data } = { ...sdk }

  const router = useRouter()
  const { pathname, query } = { ...router }
  const { address, blockchain_id } = { ...query }

  const [txs, setTxs] = useState(null)
  const [statuses, setStatuses] = useState(filter_statuses.map(({ status }) => status))
  const [web3, setWeb3] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [addTokenData, setAddTokenData] = useState(null)

  useEffect(() => {
    if (!addTokenToMetaMaskFunction) {
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
    }
  }, [web3])

  useEffect(() => {
    if (addTokenData?.chain_id === chainId && addTokenData?.contract) {
      addTokenToMetaMask(addTokenData.chain_id, addTokenData.contract)
    }
  }, [chainId, addTokenData])

  useEffect(() => {
    if (pathname || address || blockchain_id) {
      dispatch({
        type: TRANSACTIONS_DATA,
        value: null,
      })

      setTxs(null)
      setStatuses(filter_statuses.filter(({ status }) => !blockchain_id || !status?.endsWith('ing')).map(({ status }) => status))
    }
  }, [pathname, address, blockchain_id])

  useEffect(() => {
    const controller = new AbortController()

    const getTxs = async (chain, q) => {
      if (chain && !chain.disabled) {
        if (!controller.signal.aborted) {
          let params

          if (address) {
            if (['/router/[address]'].includes(pathname)) {
              params = { where: `{ router: "${address.toLowerCase()}" }`, max_size: 500 }
            }
            else if (['/address/[address]'].includes(pathname)) {
              params = { where: `{ user: "${address.toLowerCase()}" }`, max_size: 500 }
            }
          }

          if (!blockchain_id || chain.id === blockchain_id) {
            const response = await getTransactions(sdk_data, chain.chain_id, null, params, chains_data, tokens_data)

            dispatch({
              type: TRANSACTIONS_DATA,
              value: { [`${chain.chain_id}`]: response?.data || [] },
            })

            // const routers = _.reverse(['0x6db8506a7454c5a83b9e68dfc89fd7413ce97a5d', '0x95ce8b1c273af612cd895e6b0c633039c3572827', '0x1f6853bc0cc4dccd2ebf7b36c3b34dac0c1b1096', '0x31769170acae5f8c06a4577e7ff8719d742fd4c5', '0x9f27a9cacef594eb60dc4e8e6cc1f5817fd7b1af', '0x92495600b72ef0e1fa22453b58938a9af49918ae', '0xd7d8e48abdcbd61add5d533d7ce542e54a5c3975', '0xe439ca609b964ab9422672bf83b8e171e90adad1', '0x82f6a96481433eef26bb506887eb064ccebd3b81', '0xd19b8a5be17d68f74789a9f87d20cf924f491613', '0x55af16ee16b5002d5d8baa45d59e14515db47acd', '0x8640a7769ba59e219d85802427a964068d4d99f8', '0x75ee04316185200a51e995779f381ef63d39f7f9', '0x8c336154121c0d70133b8c7f906a729cf034e5be', '0x7e76de758cd414096a4882ed2824bc513d7ed7c9', '0xa9bfe31527e8e0845cf345549f68828e6775f8c0', '0x7581f456cf77ce416c2a4a4a43857a38cbe0bafe', '0xce89263c451d62caefc54811e86e8f930204223d', '0xe4747a26b941ebdbc7ef67de7580f700e3dbf6d5', '0xee2ef40f688607cb23618d9312d62392786d13eb', '0xcf632daf0c48b075864e54a625bb655d63a3ce50', '0x724346027f0de92a3b2c8f18956103f76cda3dd4', '0x2452b99b8beca1453262fee43d2181b053291549', '0x56723283704c7f8ea3e13650413af102d4572e48', '0x2a3248456464a19fa913bd5dfa952999365b31ce', '0x467517104f300417e078d003b8817531dece4ad3', '0x84979b230fa868c1dc8e78b72fd8f5438fba032b', '0xe026086181bcfbd06db4c67739aa9c36054d5551', '0xf410f49c547115567f4209bae3dd2dbd855ddac0', '0x98a429d65e96fd048867c31e2da74573e88f2fb3', '0x83baadc390a6c63df8b3486425758d62a8bc141a', '0x3df415d9e0539de5e746ff36ff98b54cf6570722', '0x1eab42ce26873e6365bd3fffea23e59591f660e0', '0xa5b725e6e87fcd5eede4a6b7c5a47e4090f49239', '0xb3ac2b73fa658ee49abf8bc691c1239557c5cc6d', '0x1370c680f2a2ae22f711b30b917a57f052816485', '0x6fd84ba95525c4ccd218f2f16f646a08b4b0a598', '0x49b296a849dfeb21184b591b25c9d7755dfcbec5', '0xae1e59402a3f483f0bbb663800ff21a0f2b1701d', '0x6f41ff4425e6051b3b941e3d721d29199480ab58', '0x29a519e21d6a97cdb82270b69c98bac6426cdcf9', '0x22c44b2a5fd493e11090d732a824d334f5be6f21', '0xe6a3dc2971532f5feb6b650e5dda2fe923d13af2'])
            let total = 0
            // for (let i = 0; i < routers.length; i++) {
              if (/*routers[i] && */([56, 137, 250, 100, 42161, 1285].includes(chain.chain_id))) {
                const max_size = 100, size = 10
                let x, start = q ? 0 : 0
                while(!x || x.length === /*max_*/size) {
                  const res = await getTransactions(sdk_data, chain.chain_id, null, { max_size, direction: q ? 'desc' : 'asc', size, start, sync: true/*, where: `{ router: "${routers[i].toLowerCase()}" }`*/ }, chains_data, tokens_data)
                  x = res?.data
                  if (x) {
                    start+=x.length
                    total+=x.length
                  }
                  // console.log(`${chain.chain_id}: ${routers[i]}[${i}] ${total} ${start} ${x?.length}`)
                  console.log(`${chain.chain_id}: ${total} ${start} ${x?.length}`)
                }
              }
            // }
          }
        }
      }
    }

    const getData = () => {
      if (chains_data && sdk_data) {
        chains_data.forEach(c => getTxs(c))
        chains_data.forEach(c => getTxs(c, true))
      }
    }

    getData()

    // const interval = setInterval(() => getData(), 5 * 60 * 1000)
    return () => {
      controller?.abort()
      // clearInterval(interval)
    }
  }, [pathname, address, blockchain_id, sdk_data])

  useEffect(async () => {
    if (tokens_data && transactions_data) {
      let data = Object.entries(transactions_data).flatMap(([key, value]) => {
        return value?.filter(t => t).map(t => {
          return {
            ...t,
            sendingAsset: t.sendingAsset || tokens_data?.find(_t => _t?.chain_id === t.sendingChainId && _t?.contract_address === t.sendingAssetId),
            receivingAsset: t.receivingAsset || tokens_data?.find(_t => _t?.chain_id === t.receivingChainId && _t?.contract_address === t.receivingAssetId),
          }
        })
      }).map(t => {
        return {
          ...t,
          sending_amount: t.sendingAsset && BigNumber(!isNaN(t.amount) ? t.amount : 0).shiftedBy(-t.sendingAsset.contract_decimals).toNumber(),
          receiving_amount: t.receivingAsset && BigNumber(!isNaN(t.amount) ? t.amount : 0).shiftedBy(-t.receivingAsset.contract_decimals).toNumber(),
        }
      })

      data = _.orderBy(Object.entries(_.groupBy(_.orderBy(data, ['order', 'preparedTimestamp'], ['desc', 'desc']), 'transactionId')).map(([key, value]) => {
        return {
          txs: _.orderBy(_.uniqBy(value, 'chainId'), ['order', 'preparedTimestamp'], ['asc', 'asc']).map(t => {
            return {
              id: t.chainTx,
              chain_id: t.chainId,
              status: t.status,
            }
          }),
          ...(_.maxBy(value, ['order', 'preparedTimestamp'])),
          sending_amount: value?.find(t => t?.chainId === t.sendingChainId)?.sending_amount,
          receiving_amount: value?.find(t => t?.chainId === t.receivingChainId)?.receiving_amount,
        }
      }), ['preparedTimestamp'], ['desc']).map(t => {
        return {
          ...t,
          crosschain_status: blockchain_id ? t.status : t.status === 'Prepared' && t.txs?.length === 1 && t.txs[0]?.chain_id === t.sendingChainId ? 'Preparing' : t.status === 'Fulfilled' && t.txs?.findIndex(_t => _t?.status === 'Prepared') > -1 ? 'Fulfilling' : t.status,
        }
      })

      const ready = Object.keys(transactions_data).filter(cid => !blockchain_id || chains_data?.find(c => c?.id === blockchain_id)?.chain_id === Number(cid)).length >= (blockchain_id ? 1 : chains_data?.filter(c => !c?.disabled).length) &&
        chains_data?.filter(c => !c?.disabled).length <= Object.keys(_.groupBy(tokens_data, 'chain_id')).length

      if ((data.length > 0 || address || blockchain_id) && ready) {
        setTxs({ data })
      }

      if (ready) {
        const evmAddresses = _.slice(_.uniq(data.flatMap(t => [t?.sendingAddress?.toLowerCase(), t?.receivingAddress?.toLowerCase()]).filter(id => id && !ens_data?.[id])), 0, 50)
        if (evmAddresses.length > 0) {
          let ensData
          const addressChunk = _.chunk(evmAddresses, 50)

          for (let i = 0; i < addressChunk.length; i++) {
            const domainsResponse = await domains({ where: `{ resolvedAddress_in: [${addressChunk[i].map(id => `"${id?.toLowerCase()}"`).join(',')}] }` })
            ensData = _.concat(ensData || [], domainsResponse?.data || [])
          }

          if (ensData?.length > 0) {
            const ensResponses = {}
            for (let i = 0; i < evmAddresses.length; i++) {
              const evmAddress = evmAddresses[i]?.toLowerCase()
              const resolvedAddresses = ensData.filter(d => d?.resolvedAddress?.id?.toLowerCase() === evmAddress)
              if (resolvedAddresses.length > 1) {
                ensResponses[evmAddress] = await getENS(evmAddress)
              }
              else if (resolvedAddresses.length < 1) {
                ensData.push({ resolvedAddress: { id: evmAddress } })
              }
            }

            dispatch({
              type: ENS_DATA,
              value: Object.fromEntries(ensData.filter(d => !ensResponses?.[d?.resolvedAddress?.id?.toLowerCase()]?.reverseRecord || d?.name === ensResponses?.[d?.resolvedAddress?.id?.toLowerCase()].reverseRecord).map(d => [d?.resolvedAddress?.id?.toLowerCase(), { ...d }])),
            })
          }
        }
      }
    }
  }, [tokens_data, transactions_data])

  const addTokenToMetaMask = addTokenToMetaMaskFunction || (async (chain_id, contract) => {
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
  })

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
        } catch (error) {}
      }
    }

    if (contract) {
      setAddTokenData({ chain_id, contract })
    }
  }

  const filteredTxs = txs?.data?.filter(t => statuses.length < 1 || statuses.includes(t.crosschain_status))

  return (
    <>
      <div className="flex flex-wrap items-center sm:justify-end mb-2 mx-3">
        <span className="hidden sm:block text-gray-400 dark:text-gray-600 mr-3">Filter:</span>
        {filter_statuses.filter(({ status }) => !blockchain_id || !status?.endsWith('ing')).map(({ status, color }, i) => (
          <button
            key={i}
            onClick={() => setStatuses(_.uniq(statuses.includes(status) ? statuses.filter(s => s !== status) : _.concat(statuses, status)))}
            className={`btn btn-sm btn-raised min-w-max btn-rounded flex items-center ${statuses.includes(status) ? `bg-${color}-${status?.endsWith('ing') ? 400 : 500} text-white` : `bg-transparent hover:bg-${color}-50 text-${color}-500 hover:text-${color}-600 dark:hover:bg-gray-800 dark:text-gray-200 dark:hover:text-white`} text-xs my-1 mr-${i === filter_statuses.filter(({ status }) => !blockchain_id || !status?.endsWith('ing')).length - 1 ? 0 : '2 md:mr-3'} py-2 px-1.5`}
          >
            {status}
          </button>
        ))}
      </div>
      <div>
        <Datatable
          columns={[
            {
              Header: 'Tx ID',
              accessor: 'transactionId',
              disableSortBy: true,
              Cell: props => (
                !props.row.original.skeleton ?
                  <div className="space-y-1 my-1">
                    <div className="flex items-center space-x-1">
                      <Link href={`/tx/${props.value}`}>
                        <a className="uppercase text-blue-600 dark:text-white font-semibold">
                          {ellipseAddress(props.value, 8)}
                        </a>
                      </Link>
                      <Copy size={14} text={props.value} />
                    </div>
                    {props.row.original.txs?.filter(t => t.id && (t.chain_id === props.row.original.sendingChain?.chain_id || t.chain_id === props.row.original.receivingChain?.chain_id)).map((t, i) => {
                      const chain = t.chain_id === props.row.original.sendingChain?.chain_id ? props.row.original.sendingChain : props.row.original.receivingChain

                      return (
                        <div key={i} className="flex items-center space-x-1">
                          <Copy
                            size={12}
                            text={t.id}
                            copyTitle={<span className="text-gray-400 dark:text-gray-600 text-xs font-light">
                              {ellipseAddress(t.id, 8)}
                            </span>}
                          />
                          {chain?.explorer?.url && (
                            <a
                              href={`${chain.explorer.url}${chain.explorer.transaction_path?.replace('{tx}', t.id)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-white"
                            >
                              {chain.explorer.icon ?
                                <Img
                                  src={chain.explorer.icon}
                                  alt=""
                                  className="w-3.5 h-3.5 rounded-full opacity-60 hover:opacity-100"
                                />
                                :
                                <TiArrowRight size={16} className="transform -rotate-45" />
                              }
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  :
                  <div className="flex flex-col space-y-2 my-1">
                    <div className="skeleton w-32 h-5" />
                    <div className="skeleton w-28 h-4" />
                  </div>
              ),
            },
            {
              Header: 'Status',
              accessor: 'crosschain_status',
              disableSortBy: true,
              Cell: props => (
                !props.row.original.skeleton ?
                  <Link href={`/tx/${props.row.original.transactionId}`}>
                    <a className={`max-w-min h-6 bg-gray-100 dark:bg-${props.value === 'Fulfilled' ? 'green-600' : props.value === 'Fulfilling' ? 'green-400' : props.value === 'Prepared' ? 'yellow-500' : props.value === 'Preparing' ? 'blue-600' : 'red-700'} rounded-lg flex items-center space-x-1 my-1 py-1 px-1.5`}>
                      {props.value === 'Fulfilled' ?
                        <FaCheckCircle size={14} className="text-green-600 dark:text-white" />
                        :
                        props.value === 'Fulfilling' ?
                          <Puff color={theme === 'dark' ? 'white' : '#22C55E'} width="14" height="14" />
                          :
                          props.value === 'Prepared' ?
                            <FaRegCheckCircle size={14} className="text-yellow-500 dark:text-white" />
                            :
                            props.value === 'Preparing' ?
                              <TailSpin color={theme === 'dark' ? 'white' : '#3B82F6'} width="14" height="14" />
                              :
                              <FaTimesCircle size={14} className="text-red-700 dark:text-white" />
                      }
                      <span className="uppercase text-xs font-semibold">{props.value}</span>
                    </a>
                  </Link>
                  :
                  <div className="skeleton w-20 h-6 my-1" />
              ),
            },
            {
              Header: 'Initiator',
              accessor: 'sendingAddress',
              disableSortBy: true,
              Cell: props => (
                !props.row.original.skeleton ?
                  props.value ?
                    <div className="min-w-max space-y-1.5 my-1">
                      <div className="flex items-center space-x-1">
                        <Link href={`/address/${props.value}`}>
                          <a className={`text-blue-600 dark:text-white text-xs ${ens_data?.[props.value?.toLowerCase()]?.name ? 'font-semibold' : ''}`}>
                            {ellipseAddress(ens_data?.[props.value?.toLowerCase()]?.name || props.value, 8)}
                          </a>
                        </Link>
                        <Copy size={14} text={props.value} />
                        {props.row.original.sendingChain?.explorer?.url && (
                          <a
                            href={`${props.row.original.sendingChain.explorer.url}${props.row.original.sendingChain.explorer.address_path?.replace('{address}', props.value)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-white"
                          >
                            {props.row.original.sendingChain.explorer.icon ?
                              <Img
                                src={props.row.original.sendingChain.explorer.icon}
                                alt=""
                                className="w-3.5 h-3.5 rounded-full opacity-60 hover:opacity-100"
                              />
                              :
                              <TiArrowRight size={14} className="transform -rotate-45" />
                            }
                          </a>
                        )}
                      </div>
                      {props.row.original.sendingChain && (
                        <div className="flex items-center space-x-2">
                          <Img
                            src={props.row.original.sendingChain.image}
                            alt=""
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="text-gray-400 dark:text-gray-600 text-xs">{chainTitle(props.row.original.sendingChain)}</span>
                        </div>
                      )}
                    </div>
                    :
                    <div className="text-gray-400 dark:text-gray-600 font-light my-1">Unknown</div>
                  :
                  <div className="flex flex-col space-y-2.5 my-1">
                    <div className="skeleton w-28 h-5" />
                    <div className="skeleton w-20 h-4" />
                  </div>
              ),
            },
            {
              Header: 'Receiver',
              accessor: 'receivingAddress',
              disableSortBy: true,
              Cell: props => (
                !props.row.original.skeleton ?
                  props.value ?
                    <div className="min-w-max space-y-1.5 my-1">
                      <div className="flex items-center space-x-1">
                        <Link href={`/address/${props.value}`}>
                          <a className={`text-blue-600 dark:text-white text-xs ${ens_data?.[props.value?.toLowerCase()]?.name ? 'font-semibold' : ''}`}>
                            {ellipseAddress(ens_data?.[props.value?.toLowerCase()]?.name || props.value, 8)}
                          </a>
                        </Link>
                        <Copy size={14} text={props.value} />
                        {props.row.original.receivingChain?.explorer?.url && (
                          <a
                            href={`${props.row.original.receivingChain.explorer.url}${props.row.original.receivingChain.explorer.address_path?.replace('{address}', props.value)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-white"
                          >
                            {props.row.original.receivingChain.explorer.icon ?
                              <Img
                                src={props.row.original.receivingChain.explorer.icon}
                                alt=""
                                className="w-3.5 h-3.5 rounded-full opacity-60 hover:opacity-100"
                              />
                              :
                              <TiArrowRight size={14} className="transform -rotate-45" />
                            }
                          </a>
                        )}
                      </div>
                      {props.row.original.receivingChain && (
                        <div className="flex items-center space-x-2">
                          <Img
                            src={props.row.original.receivingChain.image}
                            alt=""
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="text-gray-400 dark:text-gray-600 text-xs">{chainTitle(props.row.original.receivingChain)}</span>
                        </div>
                      )}
                    </div>
                    :
                    <div className="text-gray-400 dark:text-gray-600 font-light my-1">Unknown</div>
                  :
                  <div className="flex flex-col space-y-2.5 my-1">
                    <div className="skeleton w-28 h-5" />
                    <div className="skeleton w-20 h-4" />
                  </div>
              ),
            },
            {
              Header: 'Asset',
              accessor: 'receiving_amount',
              disableSortBy: true,
              Cell: props => {
                const addSendingTokenToMetaMaskButton = props.row.original.sendingChain && props.row.original.sendingAsset && props.row.original.sendingAssetId !== constants.AddressZero && (
                  <button
                    onClick={() => addTokenToMetaMask(props.row.original.sendingChain.chain_id, { ...props.row.original.sendingAsset })}
                    className="w-auto bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded flex items-center justify-center py-1 px-1.5"
                  >
                    <Img
                      src="/logos/wallets/metamask.png"
                      alt=""
                      className="w-3.5 h-3.5"
                    />
                  </button>
                )

                const addReceivingTokenToMetaMaskButton = props.row.original.receivingChain && props.row.original.receivingAsset && props.row.original.receivingAssetId !== constants.AddressZero && (
                  <button
                    onClick={() => addTokenToMetaMask(props.row.original.receivingChain.chain_id, { ...props.row.original.receivingAsset })}
                    className="w-auto bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded flex items-center justify-center py-1 px-1.5"
                  >
                    <Img
                      src="/logos/wallets/metamask.png"
                      alt=""
                      className="w-3.5 h-3.5"
                    />
                  </button>
                )

                const sendingAmount = props.row.original.sending_amount, recevingAmount = props.value

                return !props.row.original.skeleton ?
                  <div className="min-w-max flex items-center justify-between space-x-2">
                    <div className="flex flex-col items-start space-y-1.5">
                      {props.row.original.sendingAssetId && (
                        <div className="flex items-center">
                          <Img
                            src={props.row.original.sendingAsset?.image}
                            alt=""
                            className="w-5 h-5 rounded-full mr-2"
                          />
                          {props.row.original.sendingAsset?.symbol ?
                            <div className="flex items-center space-x-1">
                              <span className="font-semibold">{props.row.original.sendingAsset.symbol}</span>
                              {/*<Copy size={14} text={props.row.original.sendingAssetId} />*/}
                            </div>
                            :
                            <Copy
                              size={12}
                              text={props.row.original.sendingAssetId}
                              copyTitle={<span className="text-gray-400 dark:text-gray-600 text-2xs">
                                {ellipseAddress(props.row.original.sendingAssetId, 5)}
                              </span>}
                            />
                          }
                          {props.row.original.sendingChain?.explorer?.url && (
                            <a
                              href={`${props.row.original.sendingChain.explorer.url}${props.row.original.sendingChain.explorer.[`contract${props.row.original.sendingAssetId === constants.AddressZero ? '_0' : ''}_path`]?.replace('{address}', props.row.original.sendingAssetId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-white mb-0.5 ml-1"
                            >
                              {props.row.original.sendingChain.explorer.icon ?
                                <Img
                                  src={props.row.original.sendingChain.explorer.icon}
                                  alt=""
                                  className="w-3.5 h-3.5 rounded-full opacity-60 hover:opacity-100"
                                />
                                :
                                <TiArrowRight size={12} className="transform -rotate-45" />
                              }
                            </a>
                          )}
                          {addSendingTokenToMetaMaskButton && (
                            <div className="ml-2">
                              <Popover
                                placement="top"
                                title={<span className="normal-case text-3xs">Add token</span>}
                                content={<div className="w-32 text-3xs">Add <span className="font-semibold">{props.row.original.sendingAsset.symbol}</span> to MetaMask</div>}
                                titleClassName="py-0.5"
                                contentClassName="py-1.5"
                              >
                                {addSendingTokenToMetaMaskButton}
                              </Popover>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="font-mono leading-4 text-2xs">
                        {typeof sendingAmount === 'number' ?
                          <>
                            <span className="font-semibold mr-1">
                              {numberFormat(sendingAmount, '0,0.000000')}
                            </span>
                            <span className="text-gray-400 dark:text-gray-600 font-medium">{props.row.original.sendingAsset?.symbol}</span>
                          </>
                          :
                          <span className="text-gray-400 dark:text-gray-600">n/a</span>
                        }
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <GoCode size={20} />
                    </div>
                    <div className="flex flex-col items-end space-y-1.5">
                      {props.row.original.receivingAssetId && (
                        <div className="flex items-center">
                          <Img
                            src={props.row.original.receivingAsset?.image}
                            alt=""
                            className="w-5 h-5 rounded-full mr-2"
                          />
                          {props.row.original.receivingAsset?.symbol ?
                            <div className="flex items-center space-x-1">
                              <span className="font-semibold">{props.row.original.receivingAsset.symbol}</span>
                              {/*<Copy size={14} text={props.row.original.receivingAssetId} />*/}
                            </div>
                            :
                            <Copy
                              size={12}
                              text={props.row.original.receivingAssetId}
                              copyTitle={<span className="text-gray-400 dark:text-gray-600 text-2xs">
                                {ellipseAddress(props.row.original.receivingAssetId, 5)}
                              </span>}
                            />
                          }
                          {props.row.original.receivingChain?.explorer?.url && (
                            <a
                              href={`${props.row.original.receivingChain.explorer.url}${props.row.original.receivingChain.explorer.[`contract${props.row.original.receivingAssetId === constants.AddressZero ? '_0' : ''}_path`]?.replace('{address}', props.row.original.receivingAssetId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-white mb-0.5 ml-1"
                            >
                              {props.row.original.receivingChain.explorer.icon ?
                                <Img
                                  src={props.row.original.receivingChain.explorer.icon}
                                  alt=""
                                  className="w-3.5 h-3.5 rounded-full opacity-60 hover:opacity-100"
                                />
                                :
                                <TiArrowRight size={12} className="transform -rotate-45" />
                              }
                            </a>
                          )}
                          {addReceivingTokenToMetaMaskButton && (
                            <div className="ml-2">
                              <Popover
                                placement="top"
                                title={<span className="normal-case text-3xs">Add token</span>}
                                content={<div className="w-32 text-3xs">Add <span className="font-semibold">{props.row.original.receivingAsset.symbol}</span> to MetaMask</div>}
                                titleClassName="py-0.5"
                                contentClassName="py-1.5"
                              >
                                {addReceivingTokenToMetaMaskButton}
                              </Popover>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="font-mono leading-4 text-2xs">
                        {typeof recevingAmount === 'number' ?
                          <>
                            <span className="font-semibold mr-1">
                              {numberFormat(recevingAmount, '0,0.000000')}
                            </span>
                            <span className="text-gray-400 dark:text-gray-600 font-medium">{props.row.original.receivingAsset?.symbol}</span>
                          </>
                          :
                          <span className="text-gray-400 dark:text-gray-600">n/a</span>
                        }
                      </div>
                    </div>
                  </div>
                  :
                  <div className="flex flex-col items-end space-y-2.5 my-1">
                    <div className="skeleton w-28 h-5" />
                    <div className="skeleton w-28 h-4" />
                  </div>
              },
              headerClassName: 'justify-end text-right',
            },
            {
              Header: 'Time',
              accessor: 'preparedTimestamp',
              disableSortBy: true,
              Cell: props => (
                !props.row.original.skeleton ?
                  <div className="text-right my-1">
                    <span className="text-gray-400 dark:text-gray-600">
                      {Number(moment().diff(moment(props.value), 'second')) > 59 ?
                        moment(props.value).fromNow()
                        :
                        <>{moment().diff(moment(props.value), 'second')}s ago</>
                      }
                    </span>
                  </div>
                  :
                  <div className="skeleton w-20 h-5 my-1 ml-auto" />
              ),
              headerClassName: 'justify-end text-right',
            },
          ]}
          data={txs ?
            (filteredTxs || []).map((t, i) => { return { ...t, i } })
            :
            [...Array(10).keys()].map(i => { return { i, skeleton: true } })
          }
          noPagination={!txs || filteredTxs?.length <= 10 ? true : false}
          defaultPageSize={address || blockchain_id ? 25 : 100}
          className={`min-h-full ${className}`}
        />
        {txs && !(filteredTxs?.length > 0) && (
          <div className="bg-white dark:bg-gray-900 rounded-xl text-gray-300 dark:text-gray-500 text-base font-medium italic text-center m-2 py-2">
            No Transactions
          </div>
        )}
      </div>
    </>
  )
}