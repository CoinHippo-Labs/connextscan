import { useRouter } from 'next/router'

import Dashboard from '../../components/dashboard'
import SectionTitle from '../../components/section-title'

import { networks } from '../../lib/menus'

export default function Index() {
  const router = useRouter()
  const { query } = { ...router }
  const { chain_id } = { ...query }
  const network = networks[networks.findIndex(network => network.id === chain_id)] || networks[0]

  return (
    <>
      <SectionTitle
        title="Dashboard"
        subtitle={<div className="flex items-center space-x-2 my-1">
          <img
            src={network.icon}
            alt=""
            className="w-8 h-8 rounded-full"
          />
          <span>{network.title}</span>
        </div>}
        className="flex-col sm:flex-row items-start sm:items-center"
      />
      <Dashboard />
    </>
  )
}