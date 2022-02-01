import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'
import moment from 'moment'
import BigNumber from 'bignumber.js'

import TimelyVolume from '../../components/charts/timely-volume'
import TimelyTransaction from '../../components/charts/timely-transaction'
import Assets from '../../components/assets'
// import Transactions from '../../components/transactions'
import SectionTitle from '../../components/section-title'
import Widget from '../../components/widget'

import { daily, routers as getRouters } from '../../lib/api/subgraph'
import { dayMetrics } from '../../lib/api/opensearch'
import { networks } from '../../lib/menus'
import { currency_symbol } from '../../lib/object/currency'
import { daily_time_ranges, daily_time_range, query_daily_time_range } from '../../lib/object/timely'
import { numberFormat, getName } from '../../lib/utils'

import { CONTRACTS_DATA } from '../../reducers/types'

BigNumber.config({ DECIMAL_PLACES: Number(process.env.NEXT_PUBLIC_MAX_BIGNUMBER_EXPONENTIAL_AT), EXPONENTIAL_AT: [-7, Number(process.env.NEXT_PUBLIC_MAX_BIGNUMBER_EXPONENTIAL_AT)] })

export default function Chain() {
  const dispatch = useDispatch()
  const { contracts } = useSelector(state => ({ contracts: state.contracts }), shallowEqual)
  const { contracts_data } = { ...contracts }

  const router = useRouter()
  const { query } = { ...router }
  const { blockchain_id } = { ...query }
  // const network = networks[networks.findIndex(network => network.id === blockchain_id)]

  const [assetBy, setAssetBy] = useState('assets')
  const [routers, setRouters] = useState(null)

  const [dayMetricsData, setDayMetricsData] = useState(null)
  const [timeRange, setTimeRange] = useState(_.last(daily_time_ranges?.filter(time_range => !time_range.disabled)) || { day: daily_time_range })
  const [timelyData, setTimelyData] = useState(null)
  const [chainTimelyData, setChainTimelyData] = useState(null)
  const [theVolume, setTheVolume] = useState(null)
  const [theTransaction, setTheTransaction] = useState(null)

  // useEffect(() => {
  //   const controller = new AbortController()

  //   const getData = async () => {
  //     if (network) {
  //       let response, new_contracts

  //       if (!controller.signal.aborted) {
  //         response = await getRouters({ chain_id: network.network_id }, contracts_data)

  //         if (response) {
  //           let data = response.data || []

  //           const _contracts = _.groupBy(_.uniqBy(data.flatMap(router => router.assetBalances?.map(assetBalance => { return { id: assetBalance?.assetId, chain_id: network.network_id, data: assetBalance?.data } }).filter(asset => asset.id && !(asset?.data) && !(contracts_data?.findIndex(contract => contract.id?.replace(`${network?.id}-`, '') === asset.assetId && contract.data) > -1)) || []), 'id'), 'chain_id')

  //           for (let i = 0; i < Object.entries(_contracts).length; i++) {
  //             if (!controller.signal.aborted) {
  //               const contract = Object.entries(_contracts)[i]
  //               let [key, value] = contract
  //               key = Number(key)

  //               const resContracts = await getContracts(key, value?.map(_contract => _contract.id).join(','))

  //               if (resContracts?.data) {
  //                 new_contracts = _.uniqBy(_.concat(resContracts.data.filter(_contract => _contract).map(_contract => { return { id: _contract?.contract_address, chain_id: key, data: { ..._contract }, id: `${network?.id}-${_contract?.contract_address}` } }), new_contracts || []), 'id')
  //               }
  //             }
  //           }

  //           new_contracts = _.uniqBy(_.concat(new_contracts || [], contracts_data || []), 'id')

  //           data = data.map(router => {
  //             return {
  //               ...router,
  //               assetBalances: router?.assetBalances?.map(assetBalance => {
  //                 return {
  //                   ...assetBalance,
  //                   data: assetBalance.data || new_contracts?.find(contract => contract.id?.replace(`${network?.id}-`, '') === assetBalance?.id?.replace(`-${router.id}`, '') && contract.data)?.data,
  //                 }
  //               }).map(assetBalance => {
  //                 return {
  //                   ...assetBalance,
  //                   normalize_amount: assetBalance?.data?.contract_decimals && (assetBalance.amount / Math.pow(10, assetBalance.data.contract_decimals)),
  //                 }
  //               }).map(assetBalance => {
  //                 return {
  //                   ...assetBalance,
  //                   value: typeof assetBalance?.normalize_amount === 'number' && typeof assetBalance?.data?.prices?.[0].price === 'number' && (assetBalance.normalize_amount * assetBalance.data.prices[0].price),
  //                 }
  //               }),
  //             }
  //           })

  //           setRouters({ data, blockchain_id })

  //           if (!controller.signal.aborted) {
  //             if (new_contracts) {
  //               dispatch({
  //                 type: CONTRACTS_DATA,
  //                 value: new_contracts,
  //               })
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }

  //   getData()

  //   const interval = setInterval(() => getData(), 5 * 60 * 1000)
  //   return () => {
  //     controller?.abort()
  //     clearInterval(interval)
  //   }
  // }, [network])

  // useEffect(() => {
  //   const controller = new AbortController()

  //   const getData = async () => {
  //     if (!controller.signal.aborted) {
  //       if (blockchain_id) {
  //         const resDayMetrics = await dayMetrics({
  //           query: {
  //             match: { chain_id: network?.network_id },
  //           },
  //           aggs: {
  //             chains: {
  //               terms: { field: 'chain_id.keyword', size: 1000 },
  //               aggs: {
  //                 day_metrics: {
  //                   terms: { field: 'dayStartTimestamp', size: 10000 },
  //                   aggs: {
  //                     versions: {
  //                       terms: { field: 'version.keyword' },
  //                     },
  //                     sending_txs: {
  //                       sum: { field: 'sendingTxCount' },
  //                     },
  //                     receiving_txs: {
  //                       sum: { field: 'receivingTxCount' },
  //                     },
  //                     cancel_txs: {
  //                       sum: { field: 'cancelTxCount' },
  //                     },
  //                     volume_values: {
  //                       sum: { field: 'volume_value' },
  //                     },
  //                     volume_in_values: {
  //                       sum: { field: 'volumeIn_value' },
  //                     },
  //                     relayer_fee_values: {
  //                       sum: { field: 'relayerFee_value' },
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         })

  //         setDayMetricsData(resDayMetrics?.data || {})
  //       }
  //     }
  //   }

  //   getData()

  //   return () => {
  //     controller?.abort()
  //   }
  // }, [blockchain_id])

  // useEffect(() => {
  //   const controller = new AbortController()

  //   const getData = async () => {
  //     if (dayMetricsData) {
  //       let _timelyData

  //       const today = moment().utc().startOf('day')

  //       if (!controller.signal.aborted) {
  //         const response = await daily({ chain_id: network?.network_id, where: `{ dayStartTimestamp_gte: ${moment(today).subtract(dayMetricsData && Object.keys(dayMetricsData).length > 0 ? query_daily_time_range : daily_time_range, 'days').unix()} }` })

  //         _timelyData = {
  //           ..._timelyData,
  //           [`${blockchain_id}`]: _.concat(response?.data || [], dayMetricsData[`${network?.network_id}`]?.filter(day => !(response?.data?.findIndex(timely => timely?.dayStartTimestamp === day?.dayStartTimestamp) > -1)) || []),
  //         }
  //       }

  //       setTimelyData(_timelyData || {})
  //     }
  //   }

  //   getData()

  //   const interval = setInterval(() => getData(), 5 * 60 * 1000)
  //   return () => {
  //     controller?.abort()
  //     clearInterval(interval)
  //   }
  // }, [dayMetricsData])

  // useEffect(() => {
  //   const controller = new AbortController()

  //   if (contracts_data && timelyData && Object.keys(timelyData).length >= 1) {
  //     const _timelyData = Object.fromEntries(Object.entries(timelyData).map(([key, value]) => {
  //       return [
  //         key,
  //         value.map(timely => {
  //           return {
  //             ...timely,
  //             data: timely?.data || contracts_data.find(contract => contract.id?.replace(`${key}-`, '') === timely?.assetId)?.data,
  //             chain_data: networks.find(network => network.id === key),
  //           }
  //         }).map(timely => {
  //           const price = timely.data?.prices?.[0]?.price

  //           return {
  //             ...timely,
  //             volume_value: typeof timely?.volume_value === 'number' ? timely.volume_value : timely?.volume && typeof price === 'number' && (BigNumber(timely.volume).shiftedBy(-timely.data?.contract_decimals).toNumber() * price),
  //             volumeIn_value: typeof timely?.volumeIn_value === 'number' ? timely.volumeIn_value : timely?.volumeIn && typeof price === 'number' && (BigNumber(timely.volumeIn).shiftedBy(-timely.data?.contract_decimals).toNumber() * price),
  //             relayerFee_value: typeof timely?.relayerFee_value === 'number' ? timely.relayerFee_value : timely?.relayerFee && typeof price === 'number' && (BigNumber(timely.relayerFee).shiftedBy(-timely.data?.contract_decimals).toNumber() * price),
  //           }
  //         }).filter(timely => timely?.data)
  //       ]
  //     }))

  //     if (!controller.signal.aborted) {
  //       if (Object.values(_timelyData).flatMap(timely => timely).findIndex(timely => !(timely?.data)) < 0) {
  //         setChainTimelyData(_timelyData || {})
  //       }
  //     }
  //   }

  //   return () => {
  //     controller?.abort()
  //   }
  // }, [contracts_data, timelyData])

  // if (query?.blockchain_id && !network) {
  //   router.push('/')
  // }

  return (
    <>
      {/*<SectionTitle
        title="Overview"
        subtitle={<div className="flex items-center space-x-2 my-1">
          <img
            src={network?.icon}
            alt=""
            className="w-8 h-8 rounded-full"
          />
          <span>{network?.title}</span>
        </div>}
        className="flex-col sm:flex-row items-start sm:items-center"
      />
      <div className="max-w-6xl my-4 mx-auto pb-2">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-start space-y-3">
            <div className="flex items-center space-x-1 mt-auto">
              {['assets', 'routers'].map((_assetBy, i) => (
                <div
                  key={i}
                  onClick={() => setAssetBy(_assetBy)}
                  className={`btn btn-lg btn-rounded cursor-pointer whitespace-nowrap bg-trasparent ${_assetBy === assetBy ? 'bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 text-white dark:hover:text-gray-100'}`}
                >
                  {getName(_assetBy)}
                </div>
              ))}
            </div>
            <span className="ml-0 sm:ml-auto" />
            <span className="sm:text-right mb-auto ml-0 sm:ml-4">
              <div className="h-full whitespace-nowrap uppercase text-gray-400 dark:text-gray-500">Available Liquidity</div>
              {blockchain_id && routers?.blockchain_id === blockchain_id ?
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
              }
            </span>
          </div>
          <Assets data={routers} assetBy={assetBy} className="mt-4" />
        </div>
        <Widget
          title={<div className="uppercase text-gray-400 dark:text-gray-100 text-sm sm:text-base lg:text-lg font-normal mt-1 mx-7 sm:mx-3">Volume</div>}
          right={theVolume ?
            <div className="min-w-max text-right space-y-0.5 mr-6 sm:mr-3">
              <div className="font-mono text-base sm:text-xl font-semibold">{currency_symbol}{typeof theVolume.volume === 'number' ? numberFormat(theVolume.volume, '0,0') : ' -'}</div>
              <div className="text-gray-400 dark:text-gray-500 text-xs sm:text-base font-medium">{moment(theVolume.time * 1000).utc().format('MMM, D YYYY [(UTC)]')}</div>
            </div>
            :
            timelyData && chainTimelyData && <div style={{ height: '54px' }} />
          }
          contentClassName="items-start"
          className="lg:col-span-2 mt-8 px-0 sm:px-4"
        >
          <div>
            <TimelyVolume timelyData={chainTimelyData} timeRange={timeRange} theVolume={theVolume} setTheVolume={_theVolome => setTheVolume(_theVolome)} setTheTransaction={_theTransaction => setTheTransaction(_theTransaction)} />
          </div>
        </Widget>
        <Widget
          title={<div className="uppercase text-gray-400 dark:text-gray-100 text-sm sm:text-base lg:text-lg font-normal mt-1 mx-7 sm:mx-3">Transactions</div>}
          right={theTransaction ?
            <div className="min-w-max text-right space-y-0.5 mr-6 sm:mr-3">
              <div className="text-base sm:text-xl font-semibold">{typeof theTransaction.receiving_tx_count === 'number' ? numberFormat(theTransaction.receiving_tx_count, '0,0') : '-'}</div>
              <div className="text-gray-400 dark:text-gray-500 text-xs sm:text-base font-medium">{moment(theTransaction.time * 1000).utc().format('MMM, D YYYY [(UTC)]')}</div>
            </div>
            :
            timelyData && chainTimelyData && <div style={{ height: '54px' }} />
          }
          contentClassName="items-start"
          className="lg:col-span-2 mt-8 px-0 sm:px-4"
        >
          <div>
            <TimelyTransaction timelyData={chainTimelyData} theTransaction={theTransaction} setTheTransaction={_theTransaction => setTheTransaction(_theTransaction)} setTheVolume={_theVolome => setTheVolume(_theVolome)} />
          </div>
        </Widget>
        <div className="bg-white dark:bg-gray-900 rounded-lg mt-8 py-6 px-4">
          <span className="uppercase text-gray-400 dark:text-gray-500 text-base font-light mx-3">Latest Transactions</span>
          <div className="h-3" />
          <Widget className="min-h-full contents p-0">
            <Transactions />
          </Widget>
        </div>
      </div>*/}
    </>
  )
}