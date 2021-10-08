import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'

import Assets from '../../components/assets'
import Transactions from '../../components/transactions'
import SectionTitle from '../../components/section-title'
import Widget from '../../components/widget'

import { routers as getRouters } from '../../lib/api/subgraph'
import { contracts as getContracts } from '../../lib/api/covalent'
import { networks } from '../../lib/menus'
import { currency_symbol } from '../../lib/object/currency'
import { numberFormat } from '../../lib/utils'

import { CONTRACTS_DATA } from '../../reducers/types'

export default function Chain() {
  const dispatch = useDispatch()
  const { contracts } = useSelector(state => ({ contracts: state.contracts }), shallowEqual)
  const { contracts_data } = { ...contracts }

  const router = useRouter()
  const { query } = { ...router }
  const { chain_id } = { ...query }
  const network = networks[networks.findIndex(network => network.id === chain_id)]

  const [routers, setRouters] = useState(null)

  useEffect(() => {
    const getData = async () => {
      if (network) {
        const response = await getRouters({ chain_id: network.id }, contracts_data)

        if (response) {
          let data = response.data || []

          const _contracts = _.groupBy(_.uniqBy(data.flatMap(router => router.assetBalances?.map(assetBalance => { return { id: assetBalance?.id?.replace(`-${router.id}`, ''), chain_id: network.network_id, data: assetBalance?.data } }).filter(asset => asset.id && !(asset?.data) && !(contracts_data?.findIndex(contract => contract.id === asset.id?.replace(`-${router.id}`, '') && contract.data) > -1)) || []), 'id'), 'chain_id')

          let new_contracts

          for (let i = 0; i < Object.entries(_contracts).length; i++) {
            const contract = Object.entries(_contracts)[i]
            const key = contract?.[0], value = contract?.[1]

            const resContracts = await getContracts(key, value?.map(_contract => _contract.id).join(','))

            if (resContracts?.data) {
              new_contracts = _.uniqBy(_.concat(resContracts.data.filter(_contract => _contract).map(_contract => { return { id: _contract?.contract_address, chain_id: key, data: { ..._contract } } }), new_contracts || []), 'id')
            }
          }

          new_contracts = _.uniqBy(_.concat(new_contracts || [], contracts_data || []), 'id')

          data = data.map(router => {
            return {
              ...router,
              assetBalances: router?.assetBalances?.map(assetBalance => {
                return {
                  ...assetBalance,
                  data: assetBalance.data || new_contracts?.find(contract => contract.id === assetBalance?.id?.replace(`-${router.id}`, '') && contract.data)?.data,
                }
              }).map(assetBalance => {
                return {
                  ...assetBalance,
                  normalize_amount: assetBalance?.data?.contract_decimals && (assetBalance.amount / Math.pow(10, assetBalance.data.contract_decimals)),
                }
              }).map(assetBalance => {
                return {
                  ...assetBalance,
                  value: typeof assetBalance?.normalize_amount === 'number' && typeof assetBalance?.data?.prices?.[0].price === 'number' && (assetBalance?.normalize_amount * assetBalance?.data?.prices?.[0].price),
                }
              }),
            }
          })

          setRouters({ data, chain_id })

          if (new_contracts) {
            dispatch({
              type: CONTRACTS_DATA,
              value: new_contracts,
            })
          }
        }
      }
    }

    getData()

    const interval = setInterval(() => getData(), 15 * 1000)
    return () => clearInterval(interval)
  }, [network])

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
      <div className="max-w-6xl my-4 mx-auto pb-2">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-start space-y-3">
            <span className="uppercase text-gray-900 dark:text-white text-lg font-semibold mt-3">Assets</span>
            <span className="sm:text-right mb-auto ml-0 sm:ml-auto">
              <div className="h-full uppercase text-gray-400 dark:text-gray-500">Liquidity Available</div>
              {chain_id && routers?.chain_id === chain_id ?
                <div className="font-mono text-xl font-semibold">
                  {currency_symbol}
                  {routers?.data?.findIndex(router => router?.assetBalances?.findIndex(assetBalance => typeof assetBalance?.value === 'number') > -1) > -1 ?
                    numberFormat(_.sum(routers.data.flatMap(router => router?.assetBalances?.map(assetBalance => assetBalance?.value) || [])), '0,0')
                    :
                    '-'
                  }
                </div>
                :
                <div className="skeleton w-28 h-7 mt-1 sm:ml-auto" />
              }
            </span>
          </div>
          <Assets data={routers} className="mt-4" />
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg mt-8 py-6 px-4">
          <span className="uppercase text-gray-400 dark:text-gray-500 text-base font-light mx-3">Latest Transactions</span>
          <div className="h-3" />
          <Widget className="min-h-full contents p-0">
            <Transactions />
          </Widget>
        </div>
      </div>
    </>
  )
}