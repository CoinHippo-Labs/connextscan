import { useRouter } from 'next/router'

import Transactions from '../components/crosschain/transactions'
import SectionTitle from '../components/section-title'

import { networks } from '../lib/menus'

export default function TransactionsIndex() {
  const router = useRouter()
  const { pathname, query } = { ...router }
  const { chain_id } = { ...query }
  const network = networks[networks.findIndex(network => network.id === chain_id)] || (pathname.startsWith('/[chain_id]') ? null : networks[0])

  return (
    <>
      <SectionTitle
        title="Latest Transactions"
        subtitle={network?.title}
        className="flex-col sm:flex-row items-start sm:items-center"
      />
      <div className="max-w-6xl my-4 mx-auto pb-2">
        <Transactions />
      </div>
    </>
  )
}