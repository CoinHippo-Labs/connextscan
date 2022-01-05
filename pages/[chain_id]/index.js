import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'
import moment from 'moment'

import TimelyVolume from '../../components/charts/timely-volume'
import TimelyTransaction from '../../components/charts/timely-transaction'
import Assets from '../../components/assets'
import Transactions from '../../components/transactions'
import SectionTitle from '../../components/section-title'
import Widget from '../../components/widget'

import { daily, hourly, routers as getRouters } from '../../lib/api/subgraph'
import { dayMetrics } from '../../lib/api/opensearch'
import { contracts as getContracts } from '../../lib/api/covalent'
import { networks } from '../../lib/menus'
import { currency_symbol } from '../../lib/object/currency'
import { daily_time_ranges, daily_time_range, query_daily_time_range, hourly_time_range } from '../../lib/object/timely'
import { numberFormat, getName } from '../../lib/utils'

import { CONTRACTS_DATA } from '../../reducers/types'

export default function Chain() {
  const dispatch = useDispatch()
  const { contracts } = useSelector(state => ({ contracts: state.contracts }), shallowEqual)
  const { contracts_data } = { ...contracts }

  const router = useRouter()
  const { query } = { ...router }
  const { chain_id } = { ...query }
  const network = networks[networks.findIndex(network => network.id === chain_id)]

  const [assetBy, setAssetBy] = useState('assets')
  const [routers, setRouters] = useState(null)
  const [hourlyData, setHourlyData] = useState(null)

  const [dayMetricsData, setDayMetricsData] = useState(null)
  const [timeRange, setTimeRange] = useState(_.last(daily_time_ranges?.filter(time_range => !time_range.disabled)) || { day: daily_time_range })
  const [timelyData, setTimelyData] = useState(null)
  const [chainTimelyData, setChainTimelyData] = useState(null)
  const [theVolume, setTheVolume] = useState(null)
  const [theTransaction, setTheTransaction] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    const getData = async () => {
      if (network) {
        let response, new_contracts

        if (!controller.signal.aborted) {
          response = await getRouters({ chain_id: network.id }, contracts_data)

          if (response) {
            let data = response.data || []

            const _contracts = _.groupBy(_.uniqBy(data.flatMap(router => router.assetBalances?.map(assetBalance => { return { id: assetBalance?.assetId, chain_id: network.network_id, data: assetBalance?.data } }).filter(asset => asset.id && !(asset?.data) && !(contracts_data?.findIndex(contract => contract.id?.replace(`${network?.id}-`, '') === asset.assetId && contract.data) > -1)) || []), 'id'), 'chain_id')

            for (let i = 0; i < Object.entries(_contracts).length; i++) {
              if (!controller.signal.aborted) {
                const contract = Object.entries(_contracts)[i]
                let [key, value] = contract
                key = Number(key)

                const resContracts = await getContracts(key, value?.map(_contract => _contract.id).join(','))

                if (resContracts?.data) {
                  new_contracts = _.uniqBy(_.concat(resContracts.data.filter(_contract => _contract).map(_contract => { return { id: _contract?.contract_address, chain_id: key, data: { ..._contract }, id: `${network?.id}-${_contract?.contract_address}` } }), new_contracts || []), 'id')
                }
              }
            }

            new_contracts = _.uniqBy(_.concat(new_contracts || [], contracts_data || []), 'id')

            data = data.map(router => {
              return {
                ...router,
                assetBalances: router?.assetBalances?.map(assetBalance => {
                  return {
                    ...assetBalance,
                    data: assetBalance.data || new_contracts?.find(contract => contract.id?.replace(`${network?.id}-`, '') === assetBalance?.id?.replace(`-${router.id}`, '') && contract.data)?.data,
                  }
                }).map(assetBalance => {
                  return {
                    ...assetBalance,
                    normalize_amount: assetBalance?.data?.contract_decimals && (assetBalance.amount / Math.pow(10, assetBalance.data.contract_decimals)),
                  }
                }).map(assetBalance => {
                  return {
                    ...assetBalance,
                    value: typeof assetBalance?.normalize_amount === 'number' && typeof assetBalance?.data?.prices?.[0].price === 'number' && (assetBalance.normalize_amount * assetBalance.data.prices[0].price),
                  }
                }),
              }
            })

            setRouters({ data, chain_id })

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

        // const currentHour = moment().utc().startOf('hour')

        // if (!controller.signal.aborted) {
        //   response = await hourly({ chain_id, where: `{ hourStartTimestamp_gte: ${moment(currentHour).subtract(hourly_time_range, 'hours').unix()} }` })

        //   if (response) {
        //     let data = response.data || []

        //     const _new_contracts = _.cloneDeep(new_contracts)

        //     const _contracts = { [`${network.network_id}`]: _.uniqBy(data.filter(timely => timely?.assetId && !(_new_contracts?.findIndex(contract => contract.id === timely.assetId && contract.data) > -1)), 'assetId') }

        //     for (let i = 0; i < Object.entries(_contracts).length; i++) {
        //       if (!controller.signal.aborted) {
        //         const contract = Object.entries(_contracts)[i]
        //         let [key, value] = contract
        //         key = Number(key)

        //         const resContracts = await getContracts(key, value?.map(_contract => _.last(_contract.id?.split('-') || [])).join(','))

        //         if (resContracts?.data) {
        //           new_contracts = _.uniqBy(_.concat(resContracts.data.filter(_contract => _contract).map(_contract => { return { id: _contract?.contract_address, chain_id: key, data: { ..._contract }, id: `${network?.id}-${_contract?.contract_address}` } }), new_contracts || []), 'id')
        //         }
        //       }
        //     }

        //     new_contracts = _.uniqBy(_.concat(new_contracts || [], _new_contracts || []), 'id')

        //     data = data.map(timely => {
        //       return {
        //         ...timely,
        //         data: timely?.data || new_contracts?.find(contract => contract.id?.replace(`${network?.id}-`, '') === timely?.assetId && contract.data)?.data,
        //       }
        //     }).map(timely => {
        //       return {
        //         ...timely,
        //         normalize_volume: timely?.data?.contract_decimals && (timely.volume / Math.pow(10, timely.data.contract_decimals)),
        //       }
        //     }).map(timely => {
        //       return {
        //         ...timely,
        //         normalize_volume: typeof timely?.normalize_volume === 'number' && typeof timely?.data?.prices?.[0].price === 'number' && (timely.normalize_volume * timely.data.prices[0].price),
        //       }
        //     })

        //     setHourlyData({ data, chain_id })
        //   }
        // }
      }
    }

    getData()

    const interval = setInterval(() => getData(), 5 * 60 * 1000)
    return () => {
      controller?.abort()
      clearInterval(interval)
    }
  }, [network])

  useEffect(() => {
    const controller = new AbortController()

    const getData = async () => {
      if (!controller.signal.aborted) {
        if (chain_id) {
          const resDayMetrics = await dayMetrics({
            query: {
              match: { chain_id },
            },
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
                      relayer_fees: {
                        sum: { field: 'normalize_relayerFee' },
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
  }, [chain_id])

  useEffect(() => {
    const controller = new AbortController()

    const getData = async () => {
      if (dayMetricsData) {
        let _timelyData

        const today = moment().utc().startOf('day')

        if (!controller.signal.aborted) {
          const response = await daily({ chain_id: chain_id, where: `{ dayStartTimestamp_gte: ${moment(today).subtract(dayMetricsData && Object.keys(dayMetricsData).length > 0 ? query_daily_time_range : daily_time_range, 'days').unix()} }` })

          _timelyData = {
            ..._timelyData,
            [`${chain_id}`]: _.concat(response?.data || [], dayMetricsData[`${chain_id}`]?.filter(day => !(response?.data?.findIndex(timely => timely?.dayStartTimestamp === day?.dayStartTimestamp) > -1)) || []),
          }
        }

        setTimelyData(_timelyData || {})
      }
    }

    getData()

    const interval = setInterval(() => getData(), 5 * 60 * 1000)
    return () => {
      controller?.abort()
      clearInterval(interval)
    }
  }, [dayMetricsData])

  useEffect(() => {
    const controller = new AbortController()

    if (contracts_data && timelyData && Object.keys(timelyData).length >= 1) {
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
              normalize_relayerFee: timely?.data?.contract_decimals && (timely.relayerFee / Math.pow(10, timely.data.contract_decimals)),
            }
          }).map(timely => {
            return {
              ...timely,
              normalize_volume: typeof timely?._normalize_volume === 'number' ? timely._normalize_volume : typeof timely?.normalize_volume === 'number' && typeof timely?.data?.prices?.[0].price === 'number' && (timely.normalize_volume * timely.data.prices[0].price),
              normalize_volumeIn: typeof timely?._normalize_volumeIn === 'number' ? timely._normalize_volumeIn : typeof timely?.normalize_volumeIn === 'number' && typeof timely?.data?.prices?.[0].price === 'number' && (timely.normalize_volumeIn * timely.data.prices[0].price),
              normalize_relayerFee: typeof timely?._normalize_relayerFee === 'number' ? timely._normalize_relayerFee : typeof timely?.normalize_relayerFee === 'number' && typeof timely?.data?.prices?.[0].price === 'number' && (timely.normalize_relayerFee * timely.data.prices[0].price),
            }
          }).filter(timely => timely?.data)
        ]
      }))

      if (!controller.signal.aborted) {
        if (Object.values(_timelyData).flatMap(timely => timely).findIndex(timely => !(timely?.data)) < 0) {
          setChainTimelyData(_timelyData || {})
        }
      }
    }

    return () => {
      controller?.abort()
    }
  }, [contracts_data, timelyData])

  if (query?.chain_id && !network) {
    router.push('/')
  }

  return (
    <>
      <SectionTitle
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
              {chain_id && routers?.chain_id === chain_id ?
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
            {/*<span className="sm:text-right mb-auto ml-0 sm:ml-16">
              <div className="h-full whitespace-nowrap uppercase text-gray-400 dark:text-gray-500">Volume {hourly_time_range}h</div>
              {chain_id && hourlyData?.chain_id === chain_id ?
                <div className="font-mono text-xl font-semibold">
                  {currency_symbol}
                  {hourlyData?.data?.findIndex(timely => typeof timely?.normalize_volume === 'number') > -1 ?
                    numberFormat(_.sumBy(hourlyData.data, 'normalize_volume'), '0,0')
                    :
                    '-'
                  }
                </div>
                :
                <div className="skeleton w-28 h-7 mt-1 sm:ml-auto" />
              }
            </span>
            <span className="sm:text-right mb-auto ml-0 sm:ml-16">
              <div className="h-full whitespace-nowrap uppercase text-gray-400 dark:text-gray-500">TX {hourly_time_range}h</div>
              {chain_id && hourlyData?.chain_id === chain_id ?
                <div className="text-xl font-semibold">
                  {hourlyData?.data?.findIndex(timely => typeof timely?.receivingTxCount === 'number') > -1 ?
                    numberFormat(_.sumBy(hourlyData.data, 'receivingTxCount'), '0,0')
                    :
                    '-'
                  }
                </div>
                :
                <div className="skeleton w-28 h-7 mt-1 sm:ml-auto" />
              }
            </span>*/}
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
      </div>
    </>
  )
}