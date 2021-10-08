import { useRouter } from 'next/router'

import Dashboard from '../../components/dashboard'
import SectionTitle from '../../components/section-title'
import Copy from '../../components/copy'

import { networks } from '../../lib/menus'
import { ellipseAddress } from '../../lib/utils'

export default function CrosschainAddress() {
  const router = useRouter()
  const { pathname, query } = { ...router }
  const { address } = { ...query }

  return (
    <>
      <SectionTitle
        title="Address"
        subtitle={<Copy
          size={24}
          text={address}
          copyTitle={<span className="uppercase text-gray-900 dark:text-gray-100 font-medium mr-1">
            {ellipseAddress(address, 10)}
          </span>}
        />}
        className="flex-col sm:flex-row items-start sm:items-center"
      />
      <Dashboard />
    </>
  )
}