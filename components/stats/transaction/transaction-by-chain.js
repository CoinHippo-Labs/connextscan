import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'
import {
  ResponsiveContainer,
  BarChart,
  linearGradient,
  stop,
  XAxis,
  Bar,
  LabelList,
  Cell,
  Tooltip,
} from 'recharts'

import { networks } from '../../../../lib/menus'
import { numberFormat } from '../../../../lib/utils'

const CustomTooltip = ({ active, payload, label }) => {
  if (active) {
    const data = { ...payload?.[0]?.payload }

    return (
      <div className="bg-gray-50 dark:bg-gray-800 shadow-lg rounded-lg text-gray-900 dark:text-white text-xs p-2">
        <div className="flex items-center space-x-2">
          {data?.icon && (
            <img
              src={data.icon}
              alt=""
              className="w-6 h-6 rounded-full"
            />
          )}
          <span className="text-gray-700 dark:text-gray-300 text-base sm:text-sm xl:text-base font-medium">{data.title || data.short_name}</span>
        </div>
        <div className="uppercase text-gray-400 dark:text-gray-500 text-2xs mt-2">Receiving Transactions</div>
        <div className="text-base font-semibold">{typeof data.receiving_tx_count === 'number' ? numberFormat(data.receiving_tx_count, '0,0') : '-'}</div>
        {typeof data.sending_tx_count === 'number' && (
          <>
            <div className="uppercase text-gray-400 dark:text-gray-500 text-2xs mt-2">Sending Transactions</div>
            <div className="text-base font-semibold">{typeof data.sending_tx_count === 'number' ? numberFormat(data.sending_tx_count, '0,0') : '-'}</div>
          </>
        )}
        {typeof data.cancel_tx_count === 'number' && (
          <>
            <div className="uppercase text-gray-400 dark:text-gray-500 text-2xs mt-2">Cancel Transactions</div>
            <div className="text-base font-semibold">{typeof data.cancel_tx_count === 'number' ? numberFormat(data.cancel_tx_count, '0,0') : '-'}</div>
          </>
        )}
      </div>
    )
  }

  return null
}

export default function TransactionByChain() {
  const { assets, total } = useSelector(state => ({ assets: state.assets, total: state.total }), shallowEqual)
  const { assets_data } = { ...assets }
  const { total_data } = { ...total }

  const router = useRouter()

  const [data, setData] = useState(null)

  useEffect(() => {
    let _data = assets_data && total_data?.assets && Object.entries(_.groupBy(Object.values(total_data.assets).flatMap(assets => assets).flatMap(asset => {
      return {
        ...asset,
      }
    }), 'chain_data.id')).map(([key, value]) => {
      return {
        ...(value.find(asset => asset?.chain_data?.id === key)?.chain_data),
        assets: value,
        sending_tx_count: _.sumBy(value, 'sendingTxCount'),
        receiving_tx_count: _.sumBy(value, 'receivingTxCount'),
        cancel_tx_count: _.sumBy(value, 'cancelTxCount'),
      }
    }).map(chain => {
      return {
        ...chain,
        total_tx_count: (chain.sending_tx_count || 0) + (chain.receiving_tx_count || 0) + (chain.cancel_tx_count || 0),
      }
    })

    const __data = _data && _.cloneDeep(_data)

    if (__data) {
      _data = []

      for (let i = 0; i <= networks.length; i++) {
        const network = networks[i]

        if (network?.id && !network.disabled/* && __data.findIndex(chain => chain.id === network.id) > -1*/) {
          _data.push(__data.find(chain => chain.id === network.id) || { ...network, sending_tx_count: 0, receiving_tx_count: 0, cancel_tx_count: 0 })
        }
      }

      _data = _data.map((chain, i) => { return { ...chain, total_tx_count_string: numberFormat(chain.total_tx_count, '0,0.00a'), sending_tx_count_string: numberFormat(chain.sending_tx_count, '0,0.00a'), receiving_tx_count_string: numberFormat(chain.receiving_tx_count, '0,0.00a'), cancel_tx_count_string: numberFormat(chain.cancel_tx_count, '0,0.00a') } })

      setData(_data)
    }
  }, [total_data])

  const loaded = data?.findIndex(chain => chain?.assets?.findIndex(asset => !(asset?.data)) > -1) < 0

  return (
    <div className={`w-full h-56 bg-white dark:bg-gray-900 rounded-lg mt-2 ${loaded ? 'sm:pt-5 pb-0' : 'mb-2 px-7 sm:px-3'}`}>
      {loaded ?
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
            className="font-default"
          >
            <defs>
              {data.map((entry, i) => (
                <linearGradient key={i} id={`gradient-vol-${entry.short_name}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="25%" stopColor={entry?.color?.barchart} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={entry?.color?.barchart} stopOpacity={0.75} />
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey="short_name" axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }}/> 
            <Bar dataKey="cancel_tx_count" stackId="tx" minPointSize={0} onClick={chain => router.push(`/${chain.id}`)}>
              {data.map((entry, i) => (<Cell key={i} cursor="pointer" fillOpacity={1} fill={`url(#gradient-vol-${entry.short_name})`} />))}
            </Bar>
            <Bar dataKey="sending_tx_count" stackId="tx" minPointSize={0} onClick={chain => router.push(`/${chain.id}`)}>
              {data.map((entry, i) => (<Cell key={i} cursor="pointer" fillOpacity={1} fill={`url(#gradient-vol-${entry.short_name})`} />))}
            </Bar>
            <Bar dataKey="receiving_tx_count" stackId="tx" minPointSize={10} onClick={chain => router.push(`/${chain.id}`)}>
              <LabelList dataKey="total_tx_count_string" position="top" cursor="default" />
              {data.map((entry, i) => (<Cell key={i} cursor="pointer" fillOpacity={1} fill={`url(#gradient-vol-${entry.short_name})`} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        :
        <div className="skeleton h-full" />
      }
    </div>
  )
}