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

import { currency_symbol } from '../../../../lib/object/currency'
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
        <div className="uppercase text-gray-400 dark:text-gray-500 text-2xs mt-2">Liquidity</div>
        <div className="text-base font-semibold">{currency_symbol}{typeof data.liquidity === 'number' ? numberFormat(data.liquidity, '0,0') : ' -'}</div>
      </div>
    )
  }

  return null
}

export default function VolumeByChain() {
  const { contracts, assets } = useSelector(state => ({ contracts: state.contracts, assets: state.assets }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }

  const router = useRouter()

  const data = assets_data && Object.entries(_.groupBy(
    Object.values(assets_data).flatMap(asset_data => asset_data.map(asset => {
      return {
        ...asset,
        data: contracts_data?.find(contract => contract.id === asset.contract_address)?.data,
      }
    }).map(asset => {
      return {
        ...asset,
        normalize_amount: asset?.data?.contract_decimals && (asset.amount / Math.pow(10, asset.data.contract_decimals)),
      }
    }).map(asset => {
      return {
        ...asset,
        value: typeof asset?.normalize_amount === 'number' && typeof asset?.data?.prices?.[0]?.price === 'number' && (asset.normalize_amount * asset.data.prices[0].price),
      }
    })),
    'chain_data.id'
  )).map(([key, value]) => {
    return {
      ...(value.find(asset => asset.chain_data)?.chain_data),
      assets: value,
      liquidity: _.sumBy(value, 'value')
    }
  }).map(chain => { return { ...chain, liquidity_string: `${currency_symbol}${numberFormat(chain.liquidity, '0,0')}` } })

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
            <Bar dataKey="liquidity" minPointSize={10} onClick={chain => router.push(`/${chain.id}`)}>
              <LabelList dataKey="liquidity_string" position="top" cursor="default" />
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