import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import moment from 'moment'

import ChainInfo from '../components/crosschain/chain-info'
import TotalLiquidity from '../components/crosschain/summary/total-liquidity'
import TodayVolume from '../components/crosschain/summary/today-volume'
import TodayTransaction from '../components/crosschain/summary/today-transaction'
import TimelyVolume from '../components/crosschain/charts/timely-volume'
import TimelyTransaction from '../components/crosschain/charts/timely-transaction'
import LiquidityByChain from '../components/crosschain/charts/liquidity-by-chain'
import TransactionByChain from '../components/crosschain/charts/transaction-by-chain'
import TopLiquidity from '../components/crosschain/top-liquidity'
import Transactions from '../components/crosschain/transactions'
import SupportedNetworks from '../components/overview/supported-networks'
import SectionTitle from '../components/section-title'
import Widget from '../components/widget'

import { daily } from '../lib/api/subgraph'
import { isMatchRoute } from '../lib/routes'
import { currency_symbol } from '../lib/object/currency'
import { daily_time_range } from '../lib/object/timely'
import { networks } from '../lib/menus'
import { numberFormat } from '../lib/utils'

import { TIMELY_DATA } from '../reducers/types'

export default function Index() {
  const dispatch = useDispatch()
  const { contracts, assets, timely, today } = useSelector(state => ({ contracts: state.contracts, assets: state.assets, timely: state.timely, today: state.today }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }
  const { timely_data } = { ...timely }
  const { today_data } = { ...today }

  const router = useRouter()
  const { pathname, query, asPath } = { ...router }
  const { chain_id } = { ...query }
  const network = networks[networks.findIndex(network => network.id === chain_id)] || (pathname.startsWith('/[chain_id]') ? null : networks[0])
  const _asPath = asPath.includes('?') ? asPath.substring(0, asPath.indexOf('?')) : asPath

  const [theVolume, setTheVolume] = useState(null)
  const [theTransaction, setTheTransaction] = useState(null)

  useEffect(() => {
    const getData = async () => {
      if (assets_data && contracts_data/* && Object.values(assets_data).flatMap(assets => assets).findIndex(asset => contracts_data.findIndex(contract => contract.id === asset.contract_address) < 0) < 0*/) {
        let timelyData

        for (let i = 0; i < Object.entries(assets_data).length; i++) {
          const entry = Object.entries(assets_data)[i]
          const [chain_id, assets] = entry

          if (chain_id && assets?.length > 0) {
            const response = await daily({ chain_id, size: Math.ceil((daily_time_range * assets.length) / 1000) * 1000 })

            timelyData = {
              ...timelyData,
              [`${chain_id}`]: response.data?.map(timely => {
                return {
                  ...timely,
                  data: contracts_data.find(contract => contract.id === timely.assetId)?.data,
                  chain_data: networks.find(network => network.id === chain_id)
                }
              }).map(timely => {
                return {
                  ...timely,
                  normalize_volume: timely?.data?.contract_decimals && (timely.volume / Math.pow(10, timely.data.contract_decimals)),
                }
              }) || [],
            }
          }
        }

        dispatch({
          type: TIMELY_DATA,
          value: timelyData || {},
        })
      }
    }

    getData()

    const interval = setInterval(() => getData(), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [contracts_data, assets_data])

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
        right={<ChainInfo />}
        className="flex-col sm:flex-row items-start sm:items-center"
      />
      <div className="max-w-6xl my-4 mx-auto pb-2">
        <div className="grid grid-flow-row grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-base sm:text-sm lg:text-base font-normal mt-1 mx-3">Available Liquidity</div>}
          >
            <div className="mx-3">
              <TotalLiquidity />
            </div>
          </Widget>
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-base sm:text-sm lg:text-base font-normal mt-1 mx-3">Today's Volume</div>}
          >
            <div className="mx-3">
              <TodayVolume />
            </div>
          </Widget>
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-base sm:text-sm lg:text-base font-normal mt-1 mx-3">Today's Transaction</div>}
          >
            <div className="mx-3">
              <TodayTransaction />
            </div>
          </Widget>
        </div>
        <div className="grid grid-flow-row grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-lg sm:text-base lg:text-lg font-normal mt-1 mx-7 sm:mx-3">Available Liquidity by Chain</div>}
            className="lg:col-span-2 px-0 sm:px-4"
          >
            <div className="sm:mx-3">
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
              <TimelyVolume theVolume={theVolume} setTheVolume={_theVolome => setTheVolume(_theVolome)} />
            </div>
          </Widget>
        </div>
        <div className="grid grid-flow-row grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-sm sm:text-base lg:text-lg font-normal mt-1 mx-7 sm:mx-3">Transaction</div>}
            right={theTransaction && (
              <div className="min-w-max text-right space-y-0.5 mr-6 sm:mr-3">
                <div className="text-base sm:text-xl font-semibold">{typeof theTransaction.tx_count === 'number' ? numberFormat(theTransaction.tx_count, '0,0') : '-'}</div>
                <div className="text-gray-400 dark:text-gray-500 text-xs sm:text-base font-medium">{moment(theTransaction.time * 1000).utc().format('MMM, D YYYY [(UTC)]')}</div>
              </div>
            )}
            contentClassName="items-start"
            className="lg:col-span-2 px-0 sm:px-4"
          >
            <div>
              <TimelyTransaction theTransaction={theTransaction} setTheTransaction={_theTransaction => setTheTransaction(_theTransaction)} />
            </div>
          </Widget>
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-lg sm:text-base lg:text-lg font-normal mt-1 mx-7 sm:mx-3">Today's Transaction by Chain</div>}
            className="lg:col-span-2 px-0 sm:px-4"
          >
            <div className="sm:mx-3">
              <TransactionByChain />
            </div>
          </Widget>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg mt-8 py-6 px-4">
          <Link href="/bridges">
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
            <Transactions n={10} />
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
      <div className="border-red-600" />
      <div className="border-blue-400" />
      <div className="border-green-400" />
      <div className="border-blue-600" />
      <div className="border-green-500" />
      <div className="border-pink-500" />
      <div className="dark:bg-green-600" />
      <div className="dark:bg-red-700" />
      <div className="dark:bg-indigo-500" />
    </>
  )
}