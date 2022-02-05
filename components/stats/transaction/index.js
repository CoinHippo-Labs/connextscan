import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { Img } from 'react-image'
import Loader from 'react-loader-spinner'

import { chainTitle } from '../../../lib/object/chain'
import { numberFormat } from '../../../lib/utils'

export default function Transaction({ data, timeSelect }) {
  const { preferences, chains } = useSelector(state => ({ preferences: state.preferences, chains: state.chains }), shallowEqual)
  const { theme } = { ...preferences }
  const { chains_data } = { ...chains }

  const [transactionData, setTransactionData] = useState(null)

  useEffect(() => {
    if (chains_data && data) {
      const _data = data.filter(d => !timeSelect || d?.time === timeSelect)

      setTransactionData({
        data: _data,
        receivingTxCount_by_chain: Object.entries(_.groupBy(
          _data.flatMap(d => Object.entries(d?.receivingTxCount_by_chain || {}).map(([key, value]) => {
            return {
              key,
              value,
            }
          })
        ), 'key')).map(([key, value]) => {
          return {
            chain_id: Number(key),
            chain: chains_data.find(c => c?.chain_id === Number(key)),
            receivingTxCount: _.sumBy(value, 'value'),
          }
        }),
      })
    }
  }, [chains_data, data, timeSelect])

  const loaded = !!transactionData

  return (
    <div className="w-full h-60">
      {loaded ?
        <>
          <div className="h-3/5 sm:h-2/3 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-2">
              <span className="font-mono text-2xl sm:text-xl xl:text-4xl font-bold">
                {numberFormat(_.sumBy(transactionData.data, 'receivingTxCount'), '0,0')}
              </span>
              <span className="flex flex-wrap items-center justify-center text-sm">
                <span className="text-gray-400 dark:text-gray-600">Total Transactions</span>
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between space-x-2 mt-0.5">
            <div className="w-full space-y-1">
              <div className="flex items-center justify-between space-x-2">
                <span className="whitespace-nowrap uppercase text-black dark:text-white text-xs font-bold">Top 3 Destination</span>
                <span className="uppercase text-black dark:text-white text-xs font-bold">Transactions</span>
              </div>
              <div className="flex flex-col items-start space-y-1">
                {_.slice(_.orderBy(transactionData.receivingTxCount_by_chain, ['receivingTxCount'], ['desc']), 0, 3).map((d, i) => (
                  <div key={i} className="w-full h-6 flex items-center justify-between space-x-2">
                    <div className="flex items-center">
                      <Img
                        src={d?.chain?.image}
                        alt=""
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-xs font-normal ml-2">{chainTitle(d?.chain)}</span>
                    </div>
                    <span className="font-mono text-xs font-normal">
                      {numberFormat(d?.receivingTxCount, '0,0')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
        :
        <div className="w-full h-56 flex items-center justify-center">
          <Loader type="Oval" color={theme === 'dark' ? 'white' : '#3B82F6'} width="24" height="24" />
        </div>
      }
    </div>
  )
}