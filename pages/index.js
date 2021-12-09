import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'
import moment from 'moment'
import Loader from 'react-loader-spinner'

import ChainInfo from '../components/crosschain/chain-info'
import TimeRange from '../components/time-range'
import TotalLiquidity from '../components/crosschain/summary/total-liquidity'
import TotalVolume from '../components/crosschain/summary/total-volume'
import TotalTransaction from '../components/crosschain/summary/total-transaction'
import TotalFees from '../components/crosschain/summary/total-fees'
import TimelyVolume from '../components/crosschain/charts/timely-volume'
import TimelyTransaction from '../components/crosschain/charts/timely-transaction'
import TimelyFees from '../components/crosschain/charts/timely-fees'
import LiquidityByChain from '../components/crosschain/charts/liquidity-by-chain'
import TransactionByChain from '../components/crosschain/charts/transaction-by-chain'
import FeesByChain from '../components/crosschain/charts/fees-by-chain'
import TopLiquidity from '../components/crosschain/top-liquidity'
import Transactions from '../components/crosschain/transactions'
import SupportedNetworks from '../components/crosschain/supported-networks'
import SectionTitle from '../components/section-title'
import Widget from '../components/widget'

import { daily } from '../lib/api/subgraph'
import { dayMetrics } from '../lib/api/opensearch'
import { isMatchRoute } from '../lib/routes'
import { currency_symbol } from '../lib/object/currency'
import { daily_time_ranges, daily_time_range, query_daily_time_range } from '../lib/object/timely'
import { networks } from '../lib/menus'
import { numberFormat } from '../lib/utils'

import { TIMELY_DATA, TIMELY_SYNC_DATA } from '../reducers/types'

export default function Index() {
  const dispatch = useDispatch()
  const { contracts, timely, timely_sync } = useSelector(state => ({ contracts: state.contracts, timely: state.timely, timely_sync: state.timely_sync }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { timely_data } = { ...timely }
  const { timely_sync_data } = { ...timely_sync }

  const router = useRouter()
  const { pathname, query, asPath } = { ...router }
  const { chain_id, debug } = { ...query }
  const network = networks[networks.findIndex(network => network.id === chain_id)] || (pathname.startsWith('/[chain_id]') ? null : networks[0])
  const _asPath = asPath.includes('?') ? asPath.substring(0, asPath.indexOf('?')) : asPath

  const [numLoadedChains, setNumLoadedChains] = useState(0)
  const [dayMetricsData, setDayMetricsData] = useState(null)
  const [timeRange, setTimeRange] = useState(_.last(daily_time_ranges?.filter(time_range => !time_range.disabled)) || { day: daily_time_range })
  const [timelyData, setTimelyData] = useState(null)
  const [theVolume, setTheVolume] = useState(null)
  const [theTransaction, setTheTransaction] = useState(null)
  const [theFees, setTheFees] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    const getData = async () => {
      if (!controller.signal.aborted) {
        if (['/'].includes(pathname)) {
          const resDayMetrics = await dayMetrics({
            aggs: {
              chains: {
                terms: { field: 'chain_id.keyword', size: 1000 },
                aggs: {
                  day_metrics: {
                    terms: { field: 'dayStartTimestamp', size: 10000 },
                    aggs: {
                      versions: {
                        terms: { field: 'version.keyword' },
                      },
                      volumes: {
                        sum: { field: 'normalize_volume' },
                      },
                      txs: {
                        sum: { field: 'txCount' },
                      },
                      sending_txs: {
                        sum: { field: 'sendingTxCount' },
                      },
                      receiving_txs: {
                        sum: { field: 'receivingTxCount' },
                      },
                      cancel_txs: {
                        sum: { field: 'cancelTxCount' },
                      },
                      volume_ins: {
                        sum: { field: 'normalize_volumeIn' },
                      },
                    },
                  },
                },
              },
            },
          })

          setDayMetricsData(resDayMetrics?.data || {})
        }
      }
    }

    getData()

    return () => {
      controller?.abort()
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const getDataSync = async (dayMetricsData, today, _networks) => {
      if (today && _networks) {
        let _timelyData

        for (let i = 0; i < _networks.length; i++) {
          const network = _networks[i]

          const response = await daily({ chain_id: network.id, where: `{ dayStartTimestamp_gte: ${moment(today).subtract(dayMetricsData && Object.keys(dayMetricsData).length > 0 ? query_daily_time_range : daily_time_range, 'days').unix()} }` })

          _timelyData = {
            ..._timelyData,
            [`${network.id}`]: _.concat(response?.data || [], dayMetricsData.[`${network.id}`]?.filter(day => !(response?.data?.findIndex(timely => timely?.dayStartTimestamp === day?.dayStartTimestamp) > -1)) || []),
          }
        }

        dispatch({
          type: TIMELY_SYNC_DATA,
          value: _timelyData || {},
        })
      }
    }

    const getData = async isInterval => {
      if (dayMetricsData) {
        let _timelyData

        const today = moment().utc().startOf('day')

        const _networks = networks.filter(_network => _network.id && !_network.disabled)

        if (isInterval) {
          for (let i = 0; i < _networks.length; i++) {
            if (!controller.signal.aborted) {
              const network = _networks[i]

              const response = await daily({ chain_id: network.id, where: `{ dayStartTimestamp_gte: ${moment(today).subtract(dayMetricsData && Object.keys(dayMetricsData).length > 0 ? query_daily_time_range : daily_time_range, 'days').unix()} }` })

              _timelyData = {
                ..._timelyData,
                [`${network.id}`]: _.concat(response?.data || [], dayMetricsData.[`${network.id}`]?.filter(day => !(response?.data?.findIndex(timely => timely?.dayStartTimestamp === day?.dayStartTimestamp) > -1)) || []),
              }

              // setNumLoadedChains(i + 1)
            }
          }

          setTimelyData(_timelyData || {})
        }
        else if (!timely_data) {
          const chunkSize = _.head([...Array(_networks.length).keys()].map(i => i + 1).filter(i => Math.ceil(_networks.length / i) <= Number(process.env.NEXT_PUBLIC_MAX_CHUNK))) || _networks.length
          _.chunk([...Array(_networks.length).keys()], chunkSize).forEach(chunk => getDataSync(dayMetricsData, today, _networks.filter((_n, i) => chunk.includes(i))))
        }
      }
    }

    getData()

    const interval = setInterval(() => getData(true), 60 * 1000)
    return () => {
      controller?.abort()
      clearInterval(interval)
    }
  }, [dayMetricsData, timely_data])

  useEffect(() => {
    if (timely_sync_data) {
      setNumLoadedChains(Object.keys(timely_sync_data).length)

      if (Object.keys(timely_sync_data).length >= networks.filter(_network => _network.id && !_network.disabled).length) {
        setTimelyData(timely_sync_data)
      }
    }
  }, [timely_sync_data])

  useEffect(() => {
    const controller = new AbortController()

    if (contracts_data && timelyData && Object.keys(timelyData).length >= networks.filter(_network => _network.id && !_network.disabled).length) {
      const _timelyData = Object.fromEntries(Object.entries(timelyData).map(([key, value]) => {
        return [
          key,
          value.map(timely => {
            return {
              ...timely,
              data: timely?.data || contracts_data.find(contract => contract.id?.replace(`${key}-`, '') === timely?.assetId)?.data,
              chain_data: networks.find(network => network.id === key),
            }
          }).map(timely => {
            return {
              ...timely,
              normalize_volume: timely?.data?.contract_decimals && (timely.volume / Math.pow(10, timely.data.contract_decimals)),
              normalize_volumeIn: timely?.data?.contract_decimals && (timely.volumeIn / Math.pow(10, timely.data.contract_decimals)),
            }
          }).map(timely => {
            return {
              ...timely,
              normalize_volume: typeof timely?._normalize_volume === 'number' ? timely._normalize_volume : typeof timely?.normalize_volume === 'number' && typeof timely?.data?.prices?.[0].price === 'number' && (timely.normalize_volume * timely.data.prices[0].price),
              normalize_volumeIn: typeof timely?._normalize_volumeIn === 'number' ? timely._normalize_volumeIn : typeof timely?.normalize_volumeIn === 'number' && typeof timely?.data?.prices?.[0].price === 'number' && (timely.normalize_volumeIn * timely.data.prices[0].price),
            }
          }).map(timely => {
            return {
              ...timely,
              normalize_volumeIn: timely?.version === 'v0' ? timely?.normalize_volume : timely?.normalize_volumeIn,
            }
          }).filter(timely => timely?.data)
        ]
      }))

      if (!controller.signal.aborted) {
        if (Object.values(_timelyData).flatMap(timely => timely).findIndex(timely => !(timely?.data)) < 0) {
          dispatch({
            type: TIMELY_DATA,
            value: _timelyData || {},
          })
        }
      }
    }

    return () => {
      controller?.abort()
    }
  }, [contracts_data, timelyData])

  if (typeof window !== 'undefined' && pathname !== _asPath) {
    router.push(isMatchRoute(_asPath) ? asPath : '/')
  }

  if (typeof window === 'undefined' || pathname !== _asPath) {
    return (
      <span className="min-h-screen" />
    )
  }

  return (
    <>
      <SectionTitle
        title="Overview"
        subtitle={network?.title}
        right={contracts_data && timely_data ?
          <ChainInfo />
          :
          <div className="flex items-center text-sm sm:text-base space-x-2 my-1 sm:my-0 py-1.5">
            <Loader type="ThreeDots" color="gray" width="24" height="24" />
            {numLoadedChains === networks.filter(_network => _network.id && !_network.disabled).length ?
              <span className="text-gray-400 dark:text-gray-400 font-light">Loading Contracts</span>
              :
              <>
                <span className="text-gray-400 dark:text-gray-400 text-sm space-x-1">
                  <span>({numberFormat(numLoadedChains, '0,0')}</span>
                  <span>/</span>
                  <span>{networks.filter(_network => _network.id && !_network.disabled).length})</span>
                </span>
                <span className="text-gray-400 dark:text-gray-400 font-light">Fetching</span>
                <div className="flex items-center space-x-1.5">
                  <img
                    src={networks.filter(_network => _network.id && !_network.disabled)[numLoadedChains]?.icon}
                    alt=""
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="font-medium">{networks.filter(_network => _network.id && !_network.disabled)[numLoadedChains]?.short_name}</span>
                </div>
              </>
            }
          </div>
        }
        className="flex-col sm:flex-row items-start sm:items-center"
      />
      <div className="max-w-7xl mt-4 mb-6 mx-auto pb-2">
        <div className={`grid grid-flow-row grid-cols-1 sm:grid-cols-2 xl:grid-cols-${['true'].includes(debug) ? 4 : 3} gap-4 mt-8`}>
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-base sm:text-sm lg:text-base font-normal mt-1 mx-3">Available Liquidity</div>}
          >
            <div className="mx-3">
              <TotalLiquidity />
            </div>
          </Widget>
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-base sm:text-sm lg:text-base font-normal mt-1 mx-3">Total Volume</div>}
            right={<div className="mr-3"><TimeRange timeRange={timeRange} onClick={_timeRange => setTimeRange(_timeRange)} /></div>}
          >
            <div className="mx-3">
              <TotalVolume />
            </div>
          </Widget>
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-base sm:text-sm lg:text-base font-normal mt-1 mx-3">Total Txs</div>}
            right={<div className="mr-3"><TimeRange timeRange={timeRange} onClick={_timeRange => setTimeRange(_timeRange)} /></div>}
          >
            <div className="mx-3">
              <TotalTransaction />
            </div>
          </Widget>
          {['true'].includes(debug) && (
            <Widget
              title={<div className="uppercase text-gray-400 dark:text-gray-100 text-base sm:text-sm lg:text-base font-normal mt-1 mx-3">Total Fees</div>}
              right={<div className="mr-3"><TimeRange timeRange={timeRange} onClick={_timeRange => setTimeRange(_timeRange)} /></div>}
            >
              <div className="mx-3">
                <TotalFees />
              </div>
            </Widget>
          )}
        </div>
        <div className="grid grid-flow-row grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-sm sm:text-base lg:text-lg font-normal mt-1 mx-7 sm:mx-3">Available Liquidity by Chain</div>}
            className="lg:col-span-2 px-0 sm:px-4"
          >
            <div>
              <LiquidityByChain />
            </div>
          </Widget>
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-sm sm:text-base lg:text-lg font-normal mt-1 mx-7 sm:mx-3">Volume</div>}
            right={theVolume && (
              <div className="min-w-max text-right space-y-0.5 mr-6 sm:mr-3">
                <div className="font-mono text-base sm:text-xl font-semibold">{currency_symbol}{typeof theVolume.volume === 'number' ? numberFormat(theVolume.volume, '0,0') : ' -'}</div>
                <div className="text-gray-400 dark:text-gray-500 text-xs sm:text-base font-medium">{moment(theVolume.time * 1000).utc().format('MMM, D YYYY [(UTC)]')}</div>
              </div>
            )}
            contentClassName="items-start"
            className="lg:col-span-2 px-0 sm:px-4"
          >
            <div>
              <TimelyVolume timeRange={timeRange} theVolume={theVolume} setTheVolume={_theVolome => setTheVolume(_theVolome)} setTheTransaction={_theTransaction => setTheTransaction(_theTransaction)} setTheFees={_theFees => setTheFees(_theFees)} />
            </div>
          </Widget>
        </div>
        <div className="grid grid-flow-row grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-sm sm:text-base lg:text-lg font-normal mt-1 mx-7 sm:mx-3">Transactions by Chain</div>}
            right={<div className="mr-6 sm:mr-3"><TimeRange timeRange={timeRange} onClick={_timeRange => setTimeRange(_timeRange)} /></div>}
            className="lg:col-span-2 px-0 sm:px-4"
          >
            <div>
              <TransactionByChain />
            </div>
          </Widget>
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-sm sm:text-base lg:text-lg font-normal mt-1 mx-7 sm:mx-3">Transactions</div>}
            right={theTransaction && (
              <div className="min-w-max text-right space-y-0.5 mr-6 sm:mr-3">
                <div className="text-base sm:text-xl font-semibold">{typeof theTransaction.receiving_tx_count === 'number' ? numberFormat(theTransaction.receiving_tx_count, '0,0') : '-'}</div>
                <div className="text-gray-400 dark:text-gray-500 text-xs sm:text-base font-medium">{moment(theTransaction.time * 1000).utc().format('MMM, D YYYY [(UTC)]')}</div>
              </div>
            )}
            contentClassName="items-start"
            className="lg:col-span-2 px-0 sm:px-4"
          >
            <div>
              <TimelyTransaction theTransaction={theTransaction} setTheTransaction={_theTransaction => setTheTransaction(_theTransaction)} setTheVolume={_theVolome => setTheVolume(_theVolome)} setTheFees={_theFees => setTheFees(_theFees)} />
            </div>
          </Widget>
        </div>
        {['true'].includes(debug) && (
          <div className="grid grid-flow-row grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
            <Widget
              title={<div className="uppercase text-gray-400 dark:text-gray-100 text-sm sm:text-base lg:text-lg font-normal mt-1 mx-7 sm:mx-3">Traffics by Chain</div>}
              right={<div className="mr-6 sm:mr-3"><TimeRange timeRange={timeRange} onClick={_timeRange => setTimeRange(_timeRange)} /></div>}
              className="lg:col-span-2 px-0 sm:px-4"
            >
              <div>
                <FeesByChain />
              </div>
            </Widget>
            <Widget
              title={<div className="uppercase text-gray-400 dark:text-gray-100 text-sm sm:text-base lg:text-lg font-normal mt-1 mx-7 sm:mx-3">Traffics</div>}
              right={theVolume && (
                <div className="min-w-max text-right space-y-0.5 mr-6 sm:mr-3">
                  <div className="font-mono text-base sm:text-xl font-semibold">{currency_symbol}{typeof theFees.fees === 'number' ? numberFormat(theFees.fees, '0,0') : ' -'}</div>
                  <div className="text-gray-400 dark:text-gray-500 text-xs sm:text-base font-medium">{moment(theFees.time * 1000).utc().format('MMM, D YYYY [(UTC)]')}</div>
                </div>
              )}
              contentClassName="items-start"
              className="lg:col-span-2 px-0 sm:px-4"
            >
              <div>
                <TimelyFees timeRange={timeRange} theFees={theFees} setTheFees={_theFees => setTheFees(_theFees)} setTheVolume={_theVolome => setTheVolume(_theVolome)} setTheTransaction={_theTransaction => setTheTransaction(_theTransaction)} />
              </div>
            </Widget>
          </div>
        )}
        <div className="bg-white dark:bg-gray-900 rounded-lg mt-8 py-6 px-4">
          <Link href="/routers">
            <a className="uppercase text-gray-900 dark:text-white text-lg font-semibold mx-3">Top Liquidity</a>
          </Link>
          <div className="h-3" />
          <Widget className="min-h-full contents p-0">
            <TopLiquidity n={10} />
          </Widget>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg mt-8 py-6 px-4">
          <Link href="/transactions">
            <a className="uppercase text-gray-900 dark:text-white text-lg font-semibold mx-3">Latest Transactions</a>
          </Link>
          <div className="h-3" />
          <Widget className="min-h-full contents p-0">
            <Transactions n={10} event={true} />
          </Widget>
        </div>
      </div>
      <div className="pb-2">
        <SupportedNetworks />
      </div>
      <div className="dark:bg-black" />
      <div className="border-indigo-300" />
      <div className="border-yellow-400" />
      <div className="border-purple-600" />
      <div className="border-blue-400" />
      <div className="border-red-600" />
      <div className="border-red-500" />
      <div className="border-blue-600" />
      <div className="border-green-400" />
      <div className="border-yellow-500" />
      <div className="border-green-500" />
      <div className="border-pink-500" />
      <div className="dark:bg-yellow-500" />
      <div className="dark:bg-green-600" />
      <div className="dark:bg-red-700" />
      <div className="dark:bg-indigo-500" />
      <div className="dark:bg-gray-700" />
    </>
  )
}