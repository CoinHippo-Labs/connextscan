import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'
import moment from 'moment'
import {
  ResponsiveContainer,
  // AreaChart,
  BarChart,
  linearGradient,
  stop,
  XAxis,
  // Area,
  Bar,
  Cell,
  Tooltip,
} from 'recharts'

import { currency_symbol } from '../../../../lib/object/currency'
import { daily_time_range, day_s } from '../../../../lib/object/timely'
import { numberFormat } from '../../../../lib/utils'

const CustomTooltip = ({ active, payload, label }) => {
  if (active) {
    const data = { ...payload?.[0]?.payload }

    return (
      <div className="bg-gray-50 dark:bg-gray-800 shadow-lg rounded-lg text-gray-900 dark:text-white text-xs p-2">
        <div className="text-gray-600 dark:text-gray-400 text-sm">
          {moment(data?.time * 1000).utc().format('MMM D, YYYY [(UTC)]')}
        </div>
        <div className="uppercase text-gray-400 dark:text-gray-500 text-2xs mt-2">Accumulated Fees</div>
        <div className="text-base font-semibold">{currency_symbol}{typeof data.fees === 'number' ? numberFormat(data.fees, '0,0') : '-'}</div>
        <div className="uppercase text-gray-400 dark:text-gray-500 text-2xs mt-2">Volume Out</div>
        <div className="text-base font-semibold">{currency_symbol}{typeof data.volume === 'number' ? numberFormat(data.volume, '0,0') : '-'}</div>
        <div className="uppercase text-gray-400 dark:text-gray-500 text-2xs mt-2">Volume In</div>
        <div className="text-base font-semibold">{currency_symbol}{typeof data.volumeIn === 'number' ? numberFormat(data.volumeIn, '0,0') : '-'}</div>
      </div>
    )
  }

  return null
}

export default function TimelyFees({ theFees, setTheFees, setTheVolume, setTheTransaction }) {
  const { timely } = useSelector(state => ({ timely: state.timely }), shallowEqual)
  const { timely_data } = { ...timely }

  const [data, setData] = useState(null)

  useEffect(() => {
    const today = moment().utc().startOf('day')

    let _data = timely_data && _.orderBy(Object.entries(_.groupBy(Object.values(timely_data).flatMap(timely => timely), 'dayStartTimestamp')).map(([key, value]) => {
      return {
        assets: value && _.groupBy(value, 'chain_data.id'),
        time: Number(key),
        volume: _.sumBy(value, 'normalize_volume'),
        receiving_tx_count: _.sumBy(value, 'receivingTxCount'),
        volumeIn: _.sumBy(value, 'normalize_volumeIn'),
        fees: _.sumBy(value, 'normalize_relayerFee')/*_.sumBy(value, 'normalize_volumeIn') - _.sumBy(value, 'normalize_volume')*/,
      }
    }), ['time'], ['asc'])

    const __data = _data && _.cloneDeep(_data)

    if (__data) {
      _data = []

      for (let time = moment(today).subtract(daily_time_range, 'days').unix(); time <= today.unix(); time += day_s) {
        _data.push(__data.find(timely => timely.time === time) || { time, volume: 0, receiving_tx_count: 0, volumeIn: 0, fees: 0 })
      }

      _data = _data.map((timely, i) => {
        return {
          ...timely,
          fees: timely.fees/*timely.volumeIn - timely.volume*/,
          day_string: i % 2 === 0 && moment(timely.time * 1000).utc().format('DD'),
        }
      })
    
      setData(_data)

      if (setTheFees) {
        setTheFees(_.last(_data))
      }
      if (setTheVolume) {
        setTheVolume(_.last(_data))
      }
      if (setTheTransaction) {
        setTheTransaction(_.last(_data))
      }
    }
  }, [timely_data])

  const loaded = data?.findIndex(timely => timely?.assets && Object.values(timely.assets).flatMap(assets => assets).findIndex(asset => !(asset?.data)) > -1) < 0

  return (
    <div className={`w-full h-56 bg-white dark:bg-gray-900 rounded-lg mt-2 ${loaded ? 'sm:pt-5 pb-0' : 'mb-2 px-7 sm:px-3'}`}>
      {loaded ?
        <ResponsiveContainer>
          {/*<AreaChart*/}
          <BarChart
            data={data}
            onMouseEnter={event => {
              if (event) {
                if (setTheFees) {
                  setTheFees(event?.activePayload?.[0]?.payload)
                }
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
                if (setTheFees) {
                  setTheFees(event?.activePayload?.[0]?.payload)
                }
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
                if (setTheFees) {
                  setTheFees(_.last(data))
                }
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
              <linearGradient id="gradient-fees" x1="0" y1="0" x2="0" y2="1">
                <stop offset="50%" stopColor="#34D399" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#34D399" stopOpacity={0.75} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day_string" axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }}/> 
            <Bar dataKey="fees" minPointSize={5}>
              {data.map((entry, i) => (<Cell key={i} fillOpacity={1} fill="url(#gradient-fees)" />))}
            </Bar>
            {/*<Area type="basis" dataKey="fees" stroke="#047857" fillOpacity={1} fill="url(#gradient-fees)" />*/}
          </BarChart>
          {/*</AreaChart>*/}
        </ResponsiveContainer>
        :
        <div className="skeleton h-full" />
      }
    </div>
  )
}