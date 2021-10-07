import { useRouter } from 'next/router'

import Transactions from '../../components/transactions'
import SectionTitle from '../../components/section-title'
import Widget from '../../components/widget'

import { networks } from '../../lib/menus'

export default function Chain() {
  const router = useRouter()
  const { query } = { ...router }
  const { chain_id } = { ...query }
  const network = networks[networks.findIndex(network => network.id === chain_id)]

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
      <div className="my-4 mx-auto pb-2">
        <div className="max-w-6xl bg-white dark:bg-gray-800 rounded-lg mt-8 md:mt-4 mx-auto py-6 px-4">
          <span className="text-gray-900 dark:text-white text-lg font-semibold mx-3">Latest Transactions</span>
          <div className="h-3" />
          <Widget className="min-h-full contents p-0">
            <Transactions />
          </Widget>
        </div>
      </div>
    </>
  )
}