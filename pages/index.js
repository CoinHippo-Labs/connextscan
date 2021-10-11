import { useRouter } from 'next/router'

import SupportedNetworks from '../components/overview/supported-networks'
import SectionTitle from '../components/section-title'

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
      <SupportedNetworks />
      <div className="dark:bg-black" />
      <div className="bg-indigo-300" />
      <div className="bg-yellow-400" />
      <div className="bg-blue-600" />
      <div className="bg-red-600" />
      <div className="bg-indigo-400" />
      <div className="bg-gray-500" />
      <div className="bg-indigo-600" />
      <div className="bg-green-500" />
      <div className="bg-pink-500" />
      <div className="dark:bg-green-600" />
      <div className="dark:bg-red-700" />
      <div className="dark:bg-indigo-500" />
    </>
  )
}