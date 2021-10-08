import { useRouter } from 'next/router'

import SectionTitle from '../../components/section-title'
import Copy from '../../components/copy'

import { networks } from '../../lib/menus'
import { ellipseAddress } from '../../lib/utils'

export default function CrosschainTx() {
  const router = useRouter()
  const { query } = { ...router }
  const { tx } = { ...query }

  return (
    <>
      <SectionTitle
        title="Transaction"
        subtitle={<Copy
          size={24}
          text={tx}
          copyTitle={<span className="uppercase text-gray-900 dark:text-gray-100 font-medium mr-1">
            {ellipseAddress(tx, 16)}
          </span>}
        />}
        className="flex-col sm:flex-row items-start sm:items-center"
      />

    </>
  )
}