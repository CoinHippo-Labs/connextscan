import { useState, useEffect } from 'react'

import _ from 'lodash'
import moment from 'moment'
import {
  ResponsiveContainer,
  BarChart,
  linearGradient,
  stop,
  XAxis,
  Bar,
  Cell,
  Tooltip,
} from 'recharts'

import { networks } from '../../../lib/menus'
import { currency_symbol } from '../../../lib/object/currency'
import { daily_time_range, day_s } from '../../../lib/object/timely'
import { numberFormat } from '../../../lib/utils'

const CustomTooltip = ({ active, payload, label }) => {
  if (active) {
    const data = { ...payload?.[0]?.payload }

    return (
      <div className="bg-gray-50 dark:bg-gray-800 shadow-lg rounded-lg text-gray-900 dark:text-white text-xs p-2">
        <div className="flex items-center space-x-2">
          {data?.chain_data?.icon && (
            <img
              src={data.chain_data.icon}
              alt=""
              className="w-6 h-6 rounded-full"
            />
          )}
          <span className="text-gray-700 dark:text-gray-300 text-base sm:text-sm xl:text-base font-medium">{data?.chain_data?.title || data?.chain_data?.short_name}</span>
        </div>
        <div className="flex items-center space-x-3">
          <div>
            <div className="uppercase text-gray-400 dark:text-gray-500 text-2xs mt-2">Volume In</div>
            <div className="text-base font-semibold">{currency_symbol}{typeof data.volumeIn === 'number' ? numberFormat(data.volumeIn, '0,0') : '-'}</div>
          </div>
          <div>
            <div className="uppercase text-gray-400 dark:text-gray-500 text-2xs mt-2">Volume Out</div>
            <div className="text-base font-semibold">{currency_symbol}{typeof data.volume === 'number' ? numberFormat(data.volume, '0,0') : '-'}</div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default function TimelyVolume({ timelyData, timeRange, theVolume, setTheVolume, setTheTransaction }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    const today = moment().utc().startOf('day')

    let _data = timelyData && _.orderBy(Object.entries(_.groupBy(Object.values(timelyData).flatMap(timely => timely), 'dayStartTimestamp')).map(([key, value]) => {
      return {
        chain_data: _.head(value?.map(v => v?.chain_data)),
        assets: value && _.groupBy(value, 'chain_data.id'),
        time: Number(key),
        volume: _.sumBy(value, 'volume_value'),
        receiving_tx_count: _.sumBy(value, 'receivingTxCount'),
        volumeIn: _.sumBy(value, 'volumeIn_value'),
      }
    }).map(timely => {
      return {
        ...timely,
        volume_by_chain: Object.fromEntries(Object.entries(timely?.assets || {}).map(([key, value]) => [key, _.sumBy(value, 'volume_value')])),
        receiving_tx_by_chain: Object.fromEntries(Object.entries(timely?.assets || {}).map(([key, value]) => [key, _.sumBy(value, 'receivingTxCount')])),
      }
    }), ['time'], ['asc'])

    const __data = _data && _.cloneDeep(_data)

    if (__data) {
      _data = []

      for (let time = moment(today).subtract(daily_time_range, 'days').unix(); time <= today.unix(); time += day_s) {
        _data.push(__data.find(timely => timely.time === time) || { time, volume: 0, receiving_tx_count: 0, volumeIn: 0 })
      }

      _data = _data.map((timely, i) => {
        return {
          ...timely,
          day_string: i % 1 === 0 && moment(timely.time * 1000).utc().format('DD'),
        }
      })
    
      setData(_data)

      if (setTheVolume) {
        setTheVolume(_.last(_data))
      }
      if (setTheTransaction) {
        setTheTransaction(_.last(_data))
      }
    }
  }, [timeRange, timelyData])

  const loaded = data?.findIndex(timely => timely?.assets && Object.values(timely.assets).flatMap(assets => assets).findIndex(asset => !(asset?.data)) > -1) < 0

  return (
    <div className={`w-full h-56 bg-white dark:bg-gray-900 rounded-lg mt-2 ${loaded ? 'sm:pt-5 pb-0' : 'mb-2 px-7 sm:px-3'}`}>
      {loaded ?
        <ResponsiveContainer>
          <BarChart
            data={data}
            onMouseEnter={event => {
              if (event) {
                if (setTheVolume) {
                  setTheVolume(event?.activePayload?.[0]?.payload)
                }
                if (setTheTransaction) {
                  setTheTransaction(event?.activePayload?.[0]?.payload)
                }
              }
            }}
            onMouseMove={event => {
              if (event) {
                if (setTheVolume) {
                  setTheVolume(event?.activePayload?.[0]?.payload)
                }
                if (setTheTransaction) {
                  setTheTransaction(event?.activePayload?.[0]?.payload)
                }
              }
            }}
            onMouseLeave={() => {
              if (event) {
                if (setTheVolume) {
                  setTheVolume(_.last(data))
                }
                if (setTheTransaction) {
                  setTheTransaction(_.last(data))
                }
              }
            }}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            className="mobile-hidden-x"
          >
            <defs>
              <linearGradient id="gradient-vol-in" x1="0" y1="0" x2="0" y2="1">
                <stop offset="50%" stopColor="#06B6D4" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.75} />
              </linearGradient>
            </defs>
            <defs>
              <linearGradient id="gradient-vol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="50%" stopColor="#F87171" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#F87171" stopOpacity={0.75} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day_string" axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }}/> 
            <Bar dataKey="volumeIn" minPointSize={5}>
              {data.map((entry, i) => (<Cell key={i} fillOpacity={1} fill="url(#gradient-vol-in)" />))}
            </Bar>
            <Bar dataKey="volume" minPointSize={5}>
              {data.map((entry, i) => (<Cell key={i} fillOpacity={1} fill="url(#gradient-vol)" />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        :
        <div className="skeleton h-full" />
      }
    </div>
  )
}