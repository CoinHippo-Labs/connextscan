import Link from 'next/link'
import { useRouter } from 'next/router'

import ChainInfo from '../components/crosschain/chain-info'
import TotalLiquidity from '../components/crosschain/summary/total-liquidity'
import Volume24h from '../components/crosschain/summary/volume-24h'
import Transaction24h from '../components/crosschain/summary/transaction-24h'
import TimelyLiquidity from '../components/crosschain/charts/timely-liquidity'
import TimelyVolume from '../components/crosschain/charts/timely-volume'
import TimelyTransaction from '../components/crosschain/charts/timely-transaction'
import LiquidityByChain from '../components/crosschain/charts/liquidity-by-chain'
import VolumeByChain from '../components/crosschain/charts/volume-by-chain'
import TransactionByChain from '../components/crosschain/charts/transaction-by-chain'
import TopLiquidity from '../components/crosschain/top-liquidity'
import Transactions from '../components/crosschain/transactions'
import SupportedNetworks from '../components/overview/supported-networks'
import SectionTitle from '../components/section-title'
import Widget from '../components/widget'

import { isMatchRoute } from '../lib/routes'
import { networks } from '../lib/menus'

export default function Index() {
  const router = useRouter()
  const { pathname, query, asPath } = { ...router }
  const { chain_id } = { ...query }
  const network = networks[networks.findIndex(network => network.id === chain_id)] || (pathname.startsWith('/[chain_id]') ? null : networks[0])
  const _asPath = asPath.includes('?') ? asPath.substring(0, asPath.indexOf('?')) : asPath

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
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-base sm:text-sm lg:text-base font-normal mt-1 mx-3">Volume 24h</div>}
          >
            <div className="mx-3">
              <Volume24h />
            </div>
          </Widget>
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-base sm:text-sm lg:text-base font-normal mt-1 mx-3">Transaction 24h</div>}
          >
            <div className="mx-3">
              <Transaction24h />
            </div>
          </Widget>
        </div>
        <div className="grid grid-flow-row grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-lg sm:text-base lg:text-lg font-normal mt-1 mx-7 sm:mx-3">Daily Liquidity</div>}
            className="sm:col-span-2 px-0 sm:px-4"
          >
            <div className="sm:mx-3">
              <TimelyLiquidity />
            </div>
          </Widget>
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-lg sm:text-base lg:text-lg font-normal mt-1 mx-7 sm:mx-3">Available Liquidity by Chain</div>}
            className="sm:col-span-2 px-0 sm:px-4"
          >
            <div className="sm:mx-3">
              <LiquidityByChain />
            </div>
          </Widget>
        </div>
        <div className="grid grid-flow-row grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-lg sm:text-base lg:text-lg font-normal mt-1 mx-7 sm:mx-3">Daily Volume</div>}
            className="sm:col-span-2 px-0 sm:px-4"
          >
            <div className="sm:mx-3">
              <TimelyVolume />
            </div>
          </Widget>
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-lg sm:text-base lg:text-lg font-normal mt-1 mx-7 sm:mx-3">Volume 24h by Chain</div>}
            className="sm:col-span-2 px-0 sm:px-4"
          >
            <div className="sm:mx-3">
              <VolumeByChain />
            </div>
          </Widget>
        </div>
        <div className="grid grid-flow-row grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-lg sm:text-base lg:text-lg font-normal mt-1 mx-7 sm:mx-3">Daily Transaction</div>}
            className="sm:col-span-2 px-0 sm:px-4"
          >
            <div className="sm:mx-3">
              <TimelyTransaction />
            </div>
          </Widget>
          <Widget
            title={<div className="uppercase text-gray-400 dark:text-gray-100 text-lg sm:text-base lg:text-lg font-normal mt-1 mx-7 sm:mx-3">Transaction 24h by Chain</div>}
            className="sm:col-span-2 px-0 sm:px-4"
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