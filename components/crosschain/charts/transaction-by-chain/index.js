import { useRouter } from 'next/router'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
  Cell,
  XAxis,
  Tooltip,
} from 'recharts'

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
        <div className="uppercase text-gray-400 dark:text-gray-500 text-2xs mt-2">Transactions</div>
        <div className="text-base font-semibold">{typeof data.txCount === 'number' ? numberFormat(data.txCount, '0,0a') : ' -'}</div>
      </div>
    )
  }

  return null
}

export default function TransactionByChain() {
  const { contracts, assets, last24h } = useSelector(state => ({ contracts: state.contracts, assets: state.assets, last24h: state.last24h }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }
  const { last_24h_data } = { ...last24h }

  const router = useRouter()

  const data = assets_data && last_24h_data && Object.entries(_.groupBy(last_24h_data.map(_last_24h => {
    return {
      ..._last_24h,
      data: contracts_data?.find(contract => contract.id === _last_24h?.assetId)?.data,
      chain_data: Object.values(assets_data)?.flatMap(assets => assets).find(asset => asset.contract_address === _last_24h?.assetId)?.chain_data,
    }
  }),
    'chain_data.id'
  )).map(([key, value]) => {
    return {
      ...(value.find(asset => asset.chain_data)?.chain_data),
      assets: value,
      txCount: _.sumBy(value, 'txCount')
    }
  }).map(chain => { return { ...chain, tx_count_string: `${currency_symbol}${numberFormat(chain.txCount, '0,0')}` } })

  const loaded = data?.findIndex(chain => chain?.assets?.findIndex(asset => !(asset?.data)) > -1) < 0

  return (
    <div className={`w-full h-56 bg-white dark:bg-gray-900 rounded-lg mt-2 ${loaded ? 'sm:pt-5 pb-0 sm:px-2' : 'mb-2 px-7 sm:px-0'}`}>
      {loaded ?
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <XAxis dataKey="short_name" axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }}/> 
            <Bar dataKey="txCount" minPointSize={10} onClick={chain => router.push(`/${chain.id}`)}>
              <LabelList dataKey="tx_count_string" position="top" cursor="default" />
              {data.map((entry, i) => (<Cell key={i} cursor="pointer" fill={entry?.color?.barchart} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        :
        <div className="skeleton h-full" />
      }
    </div>
  )
}