import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { Img } from 'react-image'
import Loader from 'react-loader-spinner'
import { MdRefresh } from 'react-icons/md'
import { BsFileEarmarkCheck } from 'react-icons/bs'

import Datatable from '../../../datatable'
import Copy from '../../../copy'

import { networks } from '../../../../lib/menus'
import { currency_symbol } from '../../../../lib/object/currency'
import { numberFormat, ellipseAddress } from '../../../../lib/utils'

import { ROUTERS_STATUS_REFRESH } from '../../../../reducers/types'

export default function LeaderboardRouters({ className = '' }) {
  const dispatch = useDispatch()
  const { preferences, contracts, assets, ens, routers_status } = useSelector(state => ({ preferences: state.preferences, contracts: state.contracts, assets: state.assets, ens: state.ens, routers_status: state.routers_status }), shallowEqual)
  const { theme } = { ...preferences }
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }
  const { ens_data } = { ...ens }
  const { routers_status_data } = { ...routers_status }

  const router = useRouter()
  const { query } = { ...router }
  const { debug, all } = { ...query }

  const [routers, setRouters] = useState(null)

  useEffect(() => {
    if (contracts_data && assets_data && routers_status_data) {
      let data = _.orderBy(Object.entries(
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
      ).map(([key, value]) => {
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
      }), ['liquidity_volume'], ['desc'])

      data = data.map(_router => {
        return {
          ..._router,
          ...routers_status_data?.find(__router => __router?.routerAddress?.toLowerCase() === _router?.router_id?.toLowerCase()),
        }
      }).map(_router => {
        return {
          ..._router,
          routerAddress: (_router.routerAddress || _router.router_id)?.toLowerCase(),
          trackerLength: typeof _router?.trackerLength === 'number' ? _router.trackerLength : -1,
          activeTransactionsLength: typeof _router?.activeTransactionsLength === 'number' ? _router.activeTransactionsLength : -1,
          supportedChains: _router?.supportedChains?.filter(_chain_id => networks.findIndex(_network => _network?.network_id === _chain_id) > -1),
        }
      }).map(_router => {
        const assets = Object.fromEntries(Object.entries(_router?.assets || {}).filter(([key, value]) => _router?.supportedChains?.findIndex(_chain_id => networks.findIndex(_network => _network.id === key && _network?.network_id === _chain_id) > -1) > -1))

        if (_router?.routerVersion) {
          return {
            ..._router,
            // liquidity: assets &&_.sumBy(Object.values(assets).flatMap(_assets => _assets), 'value'),
            // liquidity_locked: assets &&_.sumBy(Object.values(assets).flatMap(_assets => _assets), 'value_locked'),
            // liquidity_lockedIn: assets &&_.sumBy(Object.values(assets).flatMap(_assets => _assets), 'value_lockedIn'),
            // liquidity_supplied: assets &&_.sumBy(Object.values(assets).flatMap(_assets => _assets), 'value_supplied'),
            // liquidity_removed: assets &&_.sumBy(Object.values(assets).flatMap(_assets => _assets), 'value_removed'),
            // liquidity_volume: assets &&_.sumBy(Object.values(assets).flatMap(_assets => _assets), 'value_volume'),
            // liquidity_volumeIn: assets &&_.sumBy(Object.values(assets).flatMap(_assets => _assets), 'value_volumeIn'),
            // total_receivingFulfillTxCount: assets &&_.sumBy(Object.values(assets.assets).flatMap(_assets => _assets), 'normalize_receivingFulfillTxCount'),
          }
        }
        else {
          return {
            ..._router,
          }
        }
      }).filter(_router => _router?.liquidity >= (['true'].includes(all) ? 0 : 1))

      setRouters(data)
    }
  }, [contracts_data, assets_data, routers_status_data])

  const refresh = () => {
   dispatch({
      type: ROUTERS_STATUS_REFRESH,
      value: true,
    })
  }

  const compareVersion = (v1, v2) => {
    if (!v1 || !v2) {
      if (v1) return 1
      return -1
    }
    else {
      v1 = v1.split('.').map(v => Number(v))
      v2 = v2.split('.').map(v => Number(v))

      for (let i = 0; i < v1.length; i++) {
        if (v1[i] > v2[i]) {
          return 1
        }
        else if (v1[i] < v2[i]) {
          return -1
        }
      }

      return -1
    }
  }

  return (
    <>
      <div className="flex items-center justify-end mb-2">
        <button
          disabled={!routers_status_data}
          onClick={() => refresh()}
          className={`hover:bg-gray-100 dark:hover:bg-gray-900 ${!routers_status_data ? 'cursor-not-allowed text-gray-800 dark:text-gray-200' : ''} rounded-lg flex items-center font-medium space-x-1.5 py-1.5 px-3`}
        >
          {routers_status_data ?
            <MdRefresh size={16} />
            :
            <Loader type="Oval" color={theme === 'dark' ? '#F9FAFB' : '#3B82F6'} width="16" height="16" />
          }
          <span>{routers_status_data ? 'Refresh' : 'Loading'}</span>
        </button>
      </div>
      <Datatable
        columns={[
          {
            Header: '#',
            accessor: 'rank',
            sortType: (rowA, rowB) => rowA.original.rank > rowB.original.rank ? 1 : -1,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="my-1">
                  -{/*numberFormat((props.flatRows?.indexOf(props.row) > -1 ? props.flatRows.indexOf(props.row) : props.value) + 1, '0,0')*/}
                </div>
                :
                <div className="skeleton w-6 h-4 my-1" />
            ),
          },
          {
            Header: 'Router',
            accessor: 'routerAddress',
            disableSortBy: true,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="space-y-0.5 my-1">
                  {ens_data?.[props.value?.toLowerCase()]?.name && (
                    <div className="flex items-center">
                      <Img
                        src={`${process.env.NEXT_PUBLIC_ENS_AVATAR_URL}/${ens_data[props.value?.toLowerCase()].name}`}
                        alt=""
                        className="w-6 h-6 rounded-full mr-2"
                      />
                      <Link href={`/router/${props.value?.toLowerCase()}`}>
                        <a className="text-gray-900 dark:text-white font-semibold">
                          {ens_data[props.value?.toLowerCase()].name}
                        </a>
                      </Link>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    {ens_data?.[props.value?.toLowerCase()]?.name ?
                      <Copy
                        text={props.value?.toLowerCase()}
                        copyTitle={<span className="text-gray-400 dark:text-gray-500 text-xs font-normal">
                          {ellipseAddress(props.value?.toLowerCase(), 10)}
                        </span>}
                      />
                      :
                      <>
                        <Link href={`/router/${props.value?.toLowerCase()}`}>
                          <a className="text-gray-900 dark:text-white text-xs font-medium">
                            {ellipseAddress(props.value?.toLowerCase(), 10)}
                          </a>
                        </Link>
                        <Copy text={props.value?.toLowerCase()} />
                      </>
                    }
                  </div>
                  {props.row.original.isRouterContract && (
                    <div className="pt-1">
                      <div className="max-w-min bg-blue-500 dark:bg-indigo-600 rounded-xl flex items-center text-white text-xs space-x-1 py-1 px-2.5">
                        <BsFileEarmarkCheck size={14} />
                        <span>RouterContract</span>
                      </div>
                    </div>
                  )}
                </div>
                :
                <div className="flex items-start space-x-2 my-1">
                  <div className="flex flex-col space-y-2.5">
                    <div className="skeleton w-24 h-4" />
                    <div className="skeleton w-32 h-3" />
                  </div>
                </div>
            ),
          },
          {
            Header: 'Version',
            accessor: 'routerVersion',
            sortType: (rowA, rowB) => compareVersion(rowA.original.routerVersion, rowB.original.routerVersion),
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="font-mono font-semibold my-1">
                  {props.value || '-'}
                </div>
                :
                <div className="skeleton w-16 h-5 my-1" />
            ),
          },
          {
            Header: 'Active Txs',
            accessor: 'activeTransactionsLength',
            sortType: (rowA, rowB) => rowA.original.activeTransactionsLength > rowB.original.activeTransactionsLength ? 1 : -1,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="font-mono font-semibold text-right my-1">
                  {props.value > -1 ? numberFormat(props.value, '0,0') : 'N/A'}
                </div>
                :
                <div className="skeleton w-12 h-5 my-1 ml-auto" />
            ),
            headerClassName: 'whitespace-nowrap justify-end text-right',
          },
          {
            Header: 'Processing Txs',
            accessor: 'trackerLength',
            sortType: (rowA, rowB) => rowA.original.trackerLength > rowB.original.trackerLength ? 1 : -1,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="font-mono font-semibold text-right my-1">
                  {props.value > -1 ? numberFormat(props.value, '0,0') : 'N/A'}
                </div>
                :
                <div className="skeleton w-12 h-5 my-1 ml-auto" />
            ),
            headerClassName: 'whitespace-nowrap justify-end text-right',
          },
          {
            Header: 'Liquidity',
            accessor: 'liquidity',
            sortType: (rowA, rowB) => rowA.original.liquidity > rowB.original.liquidity ? 1 : -1,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="font-mono font-semibold text-right my-1">
                  {currency_symbol}{numberFormat(props.value, '0,0')}
                </div>
                :
                <div className="skeleton w-20 h-5 my-1 ml-auto" />
            ),
            headerClassName: 'justify-end text-right',
          },
          {
            Header: 'Volume',
            accessor: 'liquidity_volume',
            sortType: (rowA, rowB) => rowA.original.liquidity_volume > rowB.original.liquidity_volume ? 1 : -1,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="font-mono font-semibold text-right my-1">
                  {currency_symbol}{numberFormat(props.value, '0,0')}
                </div>
                :
                <div className="skeleton w-24 h-5 my-1 ml-auto" />
            ),
            headerClassName: 'justify-end text-right',
          },
          {
            Header: 'Transactions',
            accessor: 'total_receivingFulfillTxCount',
            sortType: (rowA, rowB) => rowA.original.total_receivingFulfillTxCount > rowB.original.total_receivingFulfillTxCount ? 1 : -1,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="font-mono font-semibold text-right my-1">
                  {numberFormat(props.value, '0,0')}
                </div>
                :
                <div className="skeleton w-24 h-5 my-1 ml-auto" />
            ),
            headerClassName: 'justify-end text-right',
          },
          {
            Header: 'Accumulated Fees',
            accessor: 'liquidity_volumeIn',
            sortType: (rowA, rowB) => (rowA.original.liquidity_volumeIn - rowA.original.liquidity_volume) > (rowB.original.liquidity_volumeIn - rowB.original.liquidity_volume) ? 1 : -1,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="font-mono font-semibold text-right my-1">
                  {currency_symbol}{numberFormat(props.value - props.row.original.liquidity_volume, '0,0')}
                </div>
                :
                <div className="skeleton w-24 h-5 my-1 ml-auto" />
            ),
            headerClassName: 'whitespace-nowrap justify-end text-right',
          },
          {
            Header: 'Supported',
            accessor: 'supportedChains',
            sortType: (rowA, rowB) => (rowA.original.supportedChains ? rowA.original.supportedChains.length : -1) > (rowB.original.supportedChains ? rowB.original.supportedChains.length : -1) ? 1 : -1,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="lg:w-40 flex flex-wrap items-center justify-end my-1 ml-auto">
                  {props.value ?
                    props.value.length > 0 ?
                      props.value?.map((_chain_id, i) => (
                        networks.find(_network => _network?.network_id === _chain_id) && (
                          <Img
                            key={i}
                            src={networks.find(_network => _network?.network_id === _chain_id).icon}
                            alt=""
                            className="w-5 sm:w-4 lg:w-6 h-5 sm:h-4 lg:h-6 rounded-full mb-1 ml-0 sm:ml-1 mr-1 sm:mr-0"
                          />
                        )
                      ))
                      :
                      <span className="font-mono">-</span>
                    :
                    <span className="font-mono">N/A</span>
                  }
                </div>
                :
                <div className="skeleton w-24 h-5 my-1 ml-auto" />
            ),
            headerClassName: 'justify-end text-right',
          },
        ].filter(column => ['true'].includes(debug) || !['liquidity_volumeIn'].includes(column.accessor))}
        data={routers && routers_status_data ?
          routers.map((_router, i) => { return { ..._router, i } })
          :
          [...Array(20).keys()].map(i => { return { i, skeleton: true } })
        }
        noPagination={!routers || routers?.length <= 10 ? true : false}
        defaultPageSize={100}
        className={`min-h-full ${className}`}
      />
      {routers && !(routers.length > 0) && (
        <div className="bg-white dark:bg-gray-900 text-gray-300 dark:text-gray-500 text-base font-medium italic text-center my-4 py-2">
          No Routers
        </div>
      )}
    </>
  )
}