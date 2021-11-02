import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { Img } from 'react-image'
import { MdOutlineRouter } from 'react-icons/md'
import { TiArrowRight } from 'react-icons/ti'

import Transactions from '../../components/crosschain/transactions'
import SectionTitle from '../../components/section-title'
import Copy from '../../components/copy'
import Widget from '../../components/widget'

import { transactions as getTransactions } from '../../lib/api/subgraph'
import { contracts as getContracts } from '../../lib/api/covalent'
import { networks } from '../../lib/menus'
import { currency_symbol } from '../../lib/object/currency'
import { numberFormat, ellipseAddress } from '../../lib/utils'

import { CONTRACTS_DATA } from '../../reducers/types'

export default function RouterAddress() {
  const dispatch = useDispatch()
  const { contracts, assets, ens } = useSelector(state => ({ contracts: state.contracts, assets: state.assets, ens: state.ens }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }
  const { ens_data } = { ...ens }

  const router = useRouter()
  const { query } = { ...router }
  const { address } = { ...query }

  const [routerAssets, setRouterAssets] = useState(null)
  const [transactions, setTransactions] = useState(null)

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
          }
        }).map(asset => {
          return {
            ...asset,
            value: typeof asset?.normalize_amount === 'number' && typeof asset?.data?.prices?.[0]?.price === 'number' && (asset.normalize_amount * asset.data.prices[0].price),
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
        }
      }))

      setRouterAssets(data)
    }
  }, [contracts_data, assets_data])

  useEffect(() => {
    const controller = new AbortController()

    const getData = async () => {
      if (address) {
        let data, allTransactions, _contracts_data = _.cloneDeep(contracts_data)

        for (let i = 0; i < networks.length; i++) {
          if (!controller.signal.aborted) {
            const network = networks[i]

            if (network && network.id && typeof network.network_id === 'number' && !network.disabled) {
              const response = await getTransactions({ chain_id: network.id, where: `{ router: "${address}" }` }, _contracts_data)

              if (response) {
                const _data = response.data || []

                const _contracts = _.groupBy(_.uniqBy(_data.flatMap(tx => [{ id: tx.sendingAssetId, chain_id: tx.sendingChainId, data: tx.sendingAsset }, { id: tx.receivingAssetId, chain_id: tx.receivingChainId, data: tx.receivingAsset }]).filter(asset => asset.id && !(asset?.data) && !(_contracts_data?.findIndex(contract => contract.id?.replace(`${networks.find(_network => _network.network_id === asset?.chain_id)?.id}-`, '') === asset.id && contract.data) > -1)).map(asset => { return { ...asset, _id: `${networks.find(_network => _network.network_id === asset?.chain_id)?.id}-${asset?.id}` } }), '_id'), 'chain_id')

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
                })), ['order', 'preparedTimestamp'], ['desc', 'desc']), 'transactionId')).map(([key, value]) => { return { txs: _.orderBy(_.uniqBy(value, 'chainId'), ['order', 'preparedTimestamp'], ['asc', 'asc']).map(tx => { return { id: tx.chainTx, chain_id: tx.chainId } }), ...(_.maxBy(value, ['order', 'preparedTimestamp'])) } }), ['preparedTimestamp'], ['desc'])

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

    const interval = setInterval(() => getData(), 45 * 1000)
    return () => {
      controller?.abort()
      clearInterval(interval)
    }
  }, [address])

  return (
    <>
      <SectionTitle
        title={<div className="flex items-center space-x-1">
          <MdOutlineRouter size={20} className="mb-0.5" />
          <span>Router</span>
        </div>}
        subtitle={<div>
          {ens_data?.[address?.toLowerCase()]?.name && (
            <span>{ens_data?.[address?.toLowerCase()]?.name}</span>
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
        <div className="bg-white dark:bg-gray-900 rounded-lg mt-8 p-4 pb-6">
          <div className="flex items-center mx-3">
            <span className="uppercase text-gray-400 dark:text-gray-500 text-base font-light">Assets</span>
            {typeof routerAssets?.liquidity === 'number' && (
              <div className="flex flex-col justify-end space-y-1 ml-auto">
                <div className="whitespace-nowrap uppercase text-gray-400 dark:text-gray-500 text-2xs font-normal">Available Liquidity</div>
                <div className="font-mono sm:text-base font-semibold text-right">
                  {currency_symbol}{numberFormat(routerAssets.liquidity, '0,0')}
                </div>
              </div>
            )}
          </div>
          <div className="h-3" />
          <div className="grid grid-flow-row grid-cols-2 sm:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-0 mx-1.5 md:mx-3 lg:mx-1 xl:mx-3">
            {routerAssets?.assets && Object.values(routerAssets.assets).flatMap(assets => assets).map((asset, j) => (
              <div key={j}>
                {asset?.data ?
                  <div className={`min-h-full border ${asset?.chain_data?.color?.border} p-2 sm:p-3`}>
                    <div className="space-y-0.5">
                      {asset?.data && (
                        <div className="flex">
                          {asset.data.logo_url && (
                            <Img
                              src={asset.data.logo_url}
                              alt=""
                              className="w-5 h-5 rounded-full mr-1"
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
                                  text={asset.id.replace(`-${router.router_id}`, '')}
                                  copyTitle={<span className="text-2xs font-medium">
                                    {ellipseAddress(asset.id.replace(`-${router.router_id}`, ''), 5)}
                                  </span>}
                                />
                                {asset?.chain_data?.explorer?.url && (
                                  <a
                                    href={`${asset.chain_data.explorer.url}${asset.chain_data.explorer.contract_path?.replace('{address}', asset.id.replace(`-${router.router_id}`, ''))}`}
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
                              <a
                                className="hidden sm:block min-w-max w-3 sm:w-5 h-3 sm:h-5 relative -top-2 -right-2 ml-auto"
                              >
                                <img
                                  src={asset.chain_data.icon}
                                  alt=""
                                  className="w-3 sm:w-5 h-3 sm:h-5 rounded-full"
                                />
                              </a>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-center my-3">
                      {/*<div className="uppercase text-gray-400 dark:text-gray-500 text-2xs">Liquidity</div>*/}
                      <div>
                        <span className="font-mono text-base font-semibold mr-1.5">{asset?.normalize_amount ? numberFormat(asset.normalize_amount, '0,0') : asset?.amount && !(asset?.data) ? numberFormat(asset.amount / Math.pow(10, asset?.chain_data?.currency?.decimals), '0,0') : '-'}</span>
                        <span className="text-gray-600 dark:text-gray-400 text-sm">{asset?.data?.contract_ticker_symbol}</span>
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">~{currency_symbol}{typeof asset?.value === 'number' ? numberFormat(asset.value, '0,0') : ' -'}</div>
                    </div>
                  </div>
                  :
                  <div className="skeleton w-full" style={{ height: '9.5rem', borderRadius: 0 }} />
                }
              </div>
            ))}
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