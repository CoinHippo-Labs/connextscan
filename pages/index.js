import Link from 'next/link'
import { useRouter } from 'next/router'

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
        className="flex-col sm:flex-row items-start sm:items-center"
      />
      <div className="max-w-5xl my-4 mx-auto pb-2">
        <div className="bg-white dark:bg-gray-900 rounded-lg mt-8 py-6 px-4">
          <Link href="/bridges">
            <a className="uppercase text-gray-900 dark:text-gray-100 text-base font-medium mx-3">Top Liquidity</a>
          </Link>
          <div className="h-3" />
          <Widget className="min-h-full contents p-0">
            <TopLiquidity n={10} />
          </Widget>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg mt-8 py-6 px-4">
          <Link href="/transactions">
            <a className="uppercase text-gray-900 dark:text-gray-100 text-base font-medium mx-3">Latest Transactions</a>
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