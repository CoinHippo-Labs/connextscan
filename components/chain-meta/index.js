import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import { graphql } from '../../lib/api/subgraph'
import { networks } from '../../lib/menus'
import { numberFormat, ellipseAddress } from '../../lib/utils'

import { CHAIN_DATA } from '../../reducers/types'

export default function ChainMeta() {
  const dispatch = useDispatch()
  const { data } = useSelector(state => ({ data: state.data }), shallowEqual)
  const { chain_data } = { ...data }

  const router = useRouter()
  const { query } = { ...router }
  const { chain_id } = { ...query }
  const network = networks[networks.findIndex(network => network.id === chain_id)] || networks[0]


  useEffect(() => {
    const getData = async () => {
      let chainData

      let response = await graphql({ chain_id, query: '{ _meta { block { hash, number } } }' })

      if (response && response.data && response.data._meta && response.data._meta) {
        chainData = { ...chainData, ...response.data._meta }
      }

      if (chainData) {
        dispatch({
          type: CHAIN_DATA,
          value: chainData
        })
      }
    }

    if (chain_id) {
      getData()
    }

    const interval = setInterval(() => getData(), 10 * 1000)
    return () => clearInterval(interval)
  }, [chain_id])

  return (
    <div className="w-full bg-gray-100 dark:bg-gray-800 flex items-center py-2 px-2 sm:px-4">
      <span className="space-x-1" style={{ fontSize: '.65rem' }}>
        <span className="text-gray-600 dark:text-gray-400">Synced Block:</span>
        {typeof chain_data?.block?.number === 'number' ?
          network?.explorer ?
            <a
              href={`${network.explorer.url}${network.explorer.block_path?.replace('{block}', chain_data.block.number)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-white text-xs font-semibold"
            >
              {numberFormat(chain_data.block.number, '0,0')}
            </a>
            :
            <span className="font-medium">{numberFormat(chain_data?.block?.number, '0,0')}</span>
          :
          <span className="font-medium">-</span>
        }
      </span>
    </div>
  )
}