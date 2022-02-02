import { useRouter } from 'next/router'
import { useState } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'

import Assets from '../../components/assets'
import Transactions from '../../components/transactions'

import { currency_symbol } from '../../lib/object/currency'
import { numberFormat } from '../../lib/utils'

export default function Chain() {
  const { chains, routers_assets } = useSelector(state => ({ chains: state.chains, routers_assets: state.routers_assets }), shallowEqual)
  const { chains_data } = { ...chains }
  const { routers_assets_data } = { ...routers_assets }

  const router = useRouter()
  const { query } = { ...router }
  const { blockchain_id } = { ...query }

  const [assetBy, setAssetBy] = useState('assets')

  const chain = chains_data?.find(c => c?.id === blockchain_id)
  if (blockchain_id && chains_data && !chain) {
    router.push('/')
  }
  const hasLiquidity = routers_assets_data?.findIndex(ra => ra?.asset_balances?.findIndex(ab => ab?.chain?.chain_id === chain?.chain_id) > -1) > -1

  return (
    <>
      <div className="max-w-8xl space-y-4 sm:space-y-8 my-2 xl:mt-4 xl:mb-6 mx-auto">
        <div className="flex items-center">
          <div className="flex items-center space-x-1">
            {['assets', 'routers'].map((a, i) => (
              <div
                key={i}
                onClick={() => setAssetBy(a)}
                className={`btn btn-lg btn-rounded cursor-pointer bg-trasparent ${a === assetBy ? 'bg-gray-100 dark:bg-gray-900 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-400 hover:text-black dark:text-gray-600 dark:hover:text-white'}`}
              >
                {a}
              </div>
            ))}
          </div>
          {hasLiquidity && (
            <div className="text-right space-y-1 ml-auto">
              <div className="whitespace-nowrap uppercase text-gray-400 dark:text-gray-600 font-medium">Available Liquidity</div>
              <div className="font-mono font-semibold">
                {currency_symbol}{numberFormat(_.sumBy(routers_assets_data.flatMap(ra => ra?.asset_balances?.filter(ab => ab?.chain?.chain_id === chain?.chain_id) || []), 'amount_value'), '0,0')}
              </div>
            </div>
          )}
        </div>
        <Assets assetBy={assetBy} />
        <div className="max-w-6xl mx-auto">
          <Transactions className="no-border" />
        </div>
      </div>
    </>
  )
}