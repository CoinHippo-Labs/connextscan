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

export default function LiquidityByChain() {
  const { contracts, assets } = useSelector(state => ({ contracts: state.contracts, assets: state.assets }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }

  const router = useRouter()

  const [data, setData] = useState(null)

  useEffect(() => {
    let _data = assets_data && Object.entries(_.groupBy(
      Object.values(assets_data).flatMap(asset_data => asset_data.map(asset => {
        return {
          ...asset,
          data: contracts_data?.find(contract => contract.id?.replace(`${asset?.chain_data?.id}-`, '') === asset?.contract_address)?.data,
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
    }).map(chain => { return { ...chain, liquidity_string: `${currency_symbol}${numberFormat(chain.liquidity, chain.liquidity >= 1000000 ? '0,0.00a' : '0,0')}` } })

    const __data = _data && _.cloneDeep(_data)

    if (_data) {
      _data = []

      for (let i = 0; i <= networks.length; i++) {
        const network = networks[i]

        if (network?.id && !network.disabled) {
          _data.push(__data.find(chain => chain.id === network.id) || { ...network, liquidity: 0 })
        }
      }

      _data = _data.map((chain, i) => { return { ...chain, liquidity_string: `${currency_symbol}${numberFormat(chain.liquidity, chain.liquidity >= 100000 ? '0,0.00a' : '0,0')}` } })

      setData(_data)
    }
  }, [contracts_data, assets_data])

  const loaded = data?.findIndex(chain => chain?.assets?.findIndex(asset => !(asset?.data)) > -1) < 0

  return (
    <div className={`w-full h-56 bg-white dark:bg-gray-900 rounded-lg mt-2 ${loaded ? 'sm:pt-5 pb-0' : 'mb-2 px-7 sm:px-3'}`}>
      {loaded ?
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
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
            <Bar dataKey="liquidity" minPointSize={10} onClick={chain => router.push(`/${chain.id}`)}>
              <LabelList dataKey="liquidity_string" position="top" cursor="default" />
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