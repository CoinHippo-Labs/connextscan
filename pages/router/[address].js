import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'
import Web3 from 'web3'
import { providers, constants, Contract, utils } from 'ethers'
import BigNumber from 'bignumber.js'
import { Img } from 'react-image'
import Loader from 'react-loader-spinner'
import { TiArrowRight } from 'react-icons/ti'

import Assets from '../../components/assets'
import Transactions from '../../components/transactions'
import Copy from '../../components/copy'
import Widget from '../../components/widget'

import { type } from '../../lib/object/id'
import { currency_symbol } from '../../lib/object/currency'
import { numberFormat, ellipseAddress } from '../../lib/utils'

export default function RouterIndex() {
  const { chains, ens, routers_status, routers_assets } = useSelector(state => ({ chains: state.chains, ens: state.ens, routers_status: state.routers_status, routers_assets: state.routers_assets }), shallowEqual)
  const { chains_data } = { ...chains }
  const { ens_data } = { ...ens }
  const { routers_status_data } = { ...routers_status }
  const { routers_assets_data } = { ...routers_assets }

  const router = useRouter()
  const { query } = { ...router }
  const { address } = { ...query }

  const [routerChains, setRouterChains] = useState(null)
  const [routerGasOnChains, setRouterGasOnChains] = useState(null)
  const [retryGas, setRetryGas] = useState(null)
  const [web3, setWeb3] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [addTokenData, setAddTokenData] = useState(null)

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
    if (addTokenData?.chain_id === chainId && addTokenData?.contract) {
      addTokenToMetaMask(addTokenData.chain_id, addTokenData.contract)
    }
  }, [chainId, addTokenData])

  useEffect(() => {
    let _address = address

    if (type(_address) === 'router' && Object.entries(ens_data || {}).findIndex(([key, value]) => value?.name?.toLowerCase() === _address?.toLowerCase()) > -1) {
      _address = Object.entries(ens_data).find(([key, value]) => value?.name?.toLowerCase() === _address?.toLowerCase())[0]

      router.push(`/router/${_address}`)
    }
  }, [address, ens_data])

  // useEffect(() => {
  //   const controller = new AbortController()

  //   const getDataSync = async chains => {
  //     if (chains) {
  //       let balancesData

  //       for (let i = 0; i < chains.length; i++) {
  //         if (!controller.signal.aborted) {
  //           const chain = chains[i]
  //           const _network = networks.find(_network => _network?.network_id === chain.chain_id)

  //           const useRPC = ![100].includes(chain.chain_id)

  //           const response = !useRPC ?
  //             await balances(chain.chain_id, routerChains?.id)
  //             :
  //             await getChainTokenRPC(chain.chain_id, { contract_address: constants.AddressZero, contract_decimals: _network?.currency?.decimals, contract_symbol: _network?.currency?.gas_symbol })
            
  //           const network = networks.find(_network => _network.id === chain.id)

  //           balancesData = _.concat(balancesData || [], ((useRPC ? response : response?.data?.items) || [{ logo_url: network?.icon, contract_name: network?.currency?.name, contract_ticker_symbol: network?.currency?.gas_symbol }]).map(_balance => { return { ..._balance, order: networks.findIndex(_network => _network.id === chain.id), chain_data: network, logo_url: network?.icon, contract_name: network?.currency?.name } }).filter(_balance => _balance?.contract_ticker_symbol?.toLowerCase() === network?.currency?.gas_symbol?.toLowerCase()) || [])
  //         }
  //       }

  //       if (!controller.signal.aborted) {
  //         dispatch({
  //           type: ROUTER_BALANCES_SYNC_DATA,
  //           value: Object.fromEntries(chains.map(_chain => [_chain.id, balancesData?.length > 0 ? balancesData.filter(_balance => _balance?.chain_data?.id === _chain.id) : null])),
  //         })
  //       }
  //     }
  //   }

  //   const getData = async isInterval => {
  //     if (routerChains?.chains && (!routerGasOnChains || retryGas || isInterval)) {
  //       if (!retryGas) {
  //         dispatch({
  //           type: ROUTER_BALANCES_SYNC_DATA,
  //           value: null,
  //         })
  //       }

  //       const _chains = routerChains.chains.filter(_chain => retryGas && routerGasOnChains ? routerGasOnChains.findIndex(__chain => __chain?.chain_data?.id === _chain?.id && !__chain.balance) > -1 : true)

  //       const chunkSize = _.head([...Array(_chains.length).keys()].map(i => i + 1).filter(i => Math.ceil(_chains.length / i) <= Number(process.env.NEXT_PUBLIC_MAX_CHUNK * 2))) || _chains.length
  //       _.chunk([...Array(_chains.length).keys()], chunkSize).forEach(chunk => getDataSync(_chains.filter((_c, i) => chunk.includes(i))))
  //     }
  //   }

  //   getData()

  //   const interval = setInterval(() => getData(), 5 * 60 * 1000)
  //   return () => {
  //     controller?.abort()
  //     clearInterval(interval)
  //   }
  // }, [routerChains, routerGasOnChains, retryGas])

  // useEffect(() => {
  //   const controller = new AbortController()

  //   const getData = async () => {
  //     if (address) {
  //       let data, allTransactions, _contracts_data = _.cloneDeep(contracts_data)

  //       for (let i = 0; i < networks.length; i++) {
  //         if (!controller.signal.aborted) {
  //           const network = networks[i]

  //           if (network && network.id && typeof network.network_id === 'number' && !network.disabled) {
  //             const response = await getTransactions({ chain_id: network.network_id, where: `{ router: "${address.toLowerCase()}" }`, max_size: 500 }, _contracts_data)

  //             if (response) {
  //               const _data = Array.isArray(response.data) ? response.data : []

  //               const _contracts = _.groupBy(_.uniqBy(_data.flatMap(tx => [{ id: tx.sendingAssetId, chain_id: tx.sendingChainId, data: tx.sendingAsset }, { id: tx.receivingAssetId, chain_id: tx.receivingChainId, data: tx.receivingAsset }]).filter(asset => asset.id && !(asset?.data) && !(_contracts_data?.findIndex(contract => contract.id?.replace(`${networks.find(_network => _network.network_id === asset?.chain_id)?.id}-`, '') === asset.id && contract.data) > -1)).map(asset => { return { ...asset, _id: `${networks.find(_network => _network.network_id === asset?.chain_id)?.id}-${asset?.id}` } }), '_id'), 'chain_id')

  //               let new_contracts

  //               for (let j = 0; j < Object.entries(_contracts).length; j++) {
  //                 if (!controller.signal.aborted) {
  //                   const contract = Object.entries(_contracts)[j]
  //                   let [key, value] = contract
  //                   key = Number(key)

  //                   const resContracts = await getContracts(key, value?.map(_contract => _contract.id).join(','))

  //                   if (resContracts?.data) {
  //                     new_contracts = _.uniqBy(_.concat(resContracts.data.filter(_contract => _contract).map(_contract => { return { id: _contract?.contract_address, chain_id: key, data: { ..._contract }, id: `${networks.find(_network => _network.network_id === key)?.id}-${_contract?.contract_address}` } }), new_contracts || []), 'id')
  //                   }
  //                 }
  //               }

  //               new_contracts = _.uniqBy(_.concat(new_contracts || [], _contracts_data || []), 'id')

  //               allTransactions = _.concat(allTransactions || [], _data)

  //               data = _.orderBy(Object.entries(_.groupBy(_.orderBy(_.concat(data || [], allTransactions.map(tx => {
  //                 return {
  //                   ...tx,
  //                   sendingAsset: tx.sendingAsset || new_contracts?.find(contract => contract.id?.replace(`${networks.find(_network => _network.network_id === tx.sendingChainId)?.id}-`, '') === tx.sendingAssetId && contract.data)?.data,
  //                   receivingAsset: tx.receivingAsset || new_contracts?.find(contract => contract.id?.replace(`${networks.find(_network => _network.network_id === tx.receivingChainId)?.id}-`, '') === tx.receivingAssetId && contract.data)?.data,
  //                 }
  //               }).map(tx => {
  //                 return {
  //                   ...tx,
  //                   normalize_amount: ((tx.sendingChainId === network.network_id && tx.sendingAsset?.contract_decimals) || (tx.receivingChainId === network.network_id && tx.receivingAsset?.contract_decimals)) && (tx.amount / Math.pow(10, (tx.sendingChainId === network.network_id && tx.sendingAsset?.contract_decimals) || (tx.receivingChainId === network.network_id && tx.receivingAsset?.contract_decimals))),
  //                 }
  //               })), ['order', 'preparedTimestamp'], ['desc', 'desc']), 'transactionId')).map(([key, value]) => { return { txs: _.orderBy(_.uniqBy(value, 'chainId'), ['order', 'preparedTimestamp'], ['asc', 'asc']).map(tx => { return { id: tx.chainTx, chain_id: tx.chainId, status: tx.status } }), ...(_.maxBy(value, ['order', 'preparedTimestamp'])) } }), ['preparedTimestamp'], ['desc'])
  //               .map(tx => { return { ...tx, crosschain_status: tx.status === 'Prepared' && tx.txs?.length === 1 && tx.txs[0]?.chain_id === tx.sendingChainId ? 'Preparing' : tx.status === 'Fulfilled' && tx.txs?.findIndex(_tx => _tx?.status === 'Prepared') > -1 ? 'Fulfilling' : tx.status } })

  //               _contracts_data = new_contracts

  //               if (data.length > 0) {
  //                 setTransactions({ data, address })
  //               }
  //             }
  //           }
  //         }
  //       }

  //       if (!(data?.length > 0)) {
  //         setTransactions({ data: [], address })
  //       }

  //       if (!controller.signal.aborted) {
  //         if (_contracts_data) {
  //           dispatch({
  //             type: CONTRACTS_DATA,
  //             value: _contracts_data,
  //           })
  //         }
  //       }
  //     }
  //   }

  //   getData()

  //   const interval = setInterval(() => getData(), 3 * 60 * 1000)
  //   return () => {
  //     controller?.abort()
  //     clearInterval(interval)
  //   }
  // }, [address])

  const addTokenToMetaMask = async (chain_id, contract) => {
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
  }

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
        } catch (error) {
          console.log(error)
        }
      }
    }

    if (contract) {
      setAddTokenData({ chain_id, contract })
    }
  }

  const getChainBalanceRPC = async (_chain_id, contract_address) => {
    let balance

    if (_chain_id && address) {
      const provider_urls = networks.find(_network => _network?.network_id === _chain_id)?.provider_params?.[0]?.rpcUrls?.filter(rpc => rpc && !rpc.startsWith('wss://') && !rpc.startsWith('ws://')).map(rpc => new providers.JsonRpcProvider(rpc)) || []
      const provider = new providers.FallbackProvider(provider_urls)

      if (contract_address === constants.AddressZero) {
        balance = await provider.getBalance(address)
      }
      else {
        const contract = new Contract(contract_address, ['function balanceOf(address owner) view returns (uint256)'], provider)
        balance = await contract.balanceOf(address)
      }
    }

    return balance
  }

  const getChainTokenRPC = async (_chain_id, _contract, _asset) => {
    if (_chain_id && _contract) {
      let balance = await getChainBalanceRPC(_chain_id, _contract.contract_address)

      if (balance) {
        balance = balance.toString()
        const _balance = BigNumber(balance).shiftedBy(-_contract.contract_decimals).toNumber()

        if (_asset) {
          _asset = {
            ..._asset,
            balance,
            quote: (_asset.quote_rate || 0) * _balance,
          }
        }
        else {
          _asset = {
            ..._contract,
            contract_ticker_symbol: _contract.contract_symbol,
            balance,
          }
        }
      }
    }

    return [_asset]
  }

  const routerStatus = routers_status_data?.find(r => r?.routerAddress?.toLowerCase() === address?.toLowerCase())
  const routerAssets = routers_assets_data?.find(ra => ra?.router_id?.toLowerCase() === address?.toLowerCase())

  return (
    <div className="max-w-6xl space-y-4 sm:space-y-8 my-2 xl:mt-4 xl:mb-6 mx-auto">
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
          title={<div className="uppercase text-gray-400 dark:text-gray-100 text-base sm:text-sm lg:text-base font-normal mx-3">Active TXs</div>}
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
          title={<div className="uppercase text-gray-400 dark:text-gray-100 text-base sm:text-sm lg:text-base font-normal mx-3">Processing TXs</div>}
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
              {routerAssets ?
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
              {routerAssets ?
                numberFormat(routerAssets.total_receivingFulfillTxCount, '0,0')
                :
                <div className="skeleton w-20 h-6 mt-2" />
              }
            </div>
          </div>
        </Widget>
      </div>
      <Assets assetBy="routers" addTokenToMetaMaskFunction={addTokenToMetaMask} />
      <div>
        <Transactions addTokenToMetaMaskFunction={addTokenToMetaMask} className="no-border" />
      </div>
    </div>
  )
}