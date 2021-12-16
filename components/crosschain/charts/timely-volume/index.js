import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

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

import { networks } from '../../../../lib/menus'
import { currency_symbol } from '../../../../lib/object/currency'
import { daily_time_range, day_s } from '../../../../lib/object/timely'
import { numberFormat } from '../../../../lib/utils'

import { TOTAL_DATA } from '../../../../reducers/types'

const CustomTooltip = ({ active, payload, label }) => {
  if (active) {
    const data = { ...payload?.[0]?.payload }

    return (
      <div className="bg-gray-50 dark:bg-gray-800 shadow-lg rounded-lg text-gray-900 dark:text-white text-xs p-2">
        <div className="text-gray-600 dark:text-gray-400 text-sm">
          {moment(data?.time * 1000).utc().format('MMM D, YYYY [(UTC)]')}
        </div>
        <div className="grid grid-flow-row grid-cols-2 gap-3 mt-2">
          {Object.entries(data?.volume_by_chain || {}).length > 0 ?
            _.orderBy(Object.entries(data.volume_by_chain).map(([key, value]) => { return { key, value } }), ['value'], ['desc']).map(({ key, value }) => (
              <div key={key} className="flex items-center space-x-2">
                {networks?.find(_network => _network?.id === key)?.icon && (
                  <img
                    src={networks.find(_network => _network?.id === key).icon}
                    alt=""
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <span className="font-semibold">{currency_symbol}{numberFormat(value, '0,0')}</span>
              </div>
            ))
            :
            numberFormat(data?.volume, '0,0')
          }
        </div>
      </div>
    )
  }

  return null
}

export default function TimelyVolume({ timeRange, theVolume, setTheVolume, setTheTransaction, setTheFees }) {
  const dispatch = useDispatch()
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
    }).map(timely => {
      return {
        ...timely,
        volume_by_chain: Object.fromEntries(Object.entries(timely?.assets || {}).map(([key, value]) => [key, _.sumBy(value, 'normalize_volume')])),
        receiving_tx_by_chain: Object.fromEntries(Object.entries(timely?.assets || {}).map(([key, value]) => [key, _.sumBy(value, 'receivingTxCount')])),
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
          day_string: i % 2 === 0 && moment(timely.time * 1000).utc().format('DD'),
        }
      })

      const data_time_range = _.cloneDeep(__data).filter(timely => timeRange?.day ? moment(timely.time * 1000).diff(moment(today).subtract(timeRange?.day, 'days')) >= 0 : true)

      const _assets = data_time_range.map(timely => timely.assets).filter(assets => assets)

      const assets = {}

      for (let i = 0; i < _assets.length; i++) {
        const __assets = _assets[i]

        for (let j = 0; j < Object.entries(__assets).length; j++) {
          const [key, value] = Object.entries(__assets)[j]

          assets[key] = _.uniqBy(_.concat(assets[key] || [], value || []), 'id')
        }
      }

      dispatch({
        type: TOTAL_DATA,
        value: {
          assets,
          time: _.head(data_time_range)?.time,
          volume: _.sumBy(data_time_range, 'volume'),
          receiving_tx_count: _.sumBy(data_time_range, 'receiving_tx_count'),
          volumeIn: _.sumBy(data_time_range, 'volumeIn'),
          fees: _.sumBy(data_time_range, 'fees'),
          day_string: _.head(data_time_range)?.time && moment(_.head(data_time_range)?.time * 1000).utc().format('MMM D, YYYY [(UTC)]'),
        },
      })
    
      setData(_data)

      if (setTheVolume) {
        setTheVolume(_.last(_data))
      }
      if (setTheTransaction) {
        setTheTransaction(_.last(_data))
      }
      if (setTheFees) {
        setTheFees(_.last(_data))
      }
    }
  }, [timeRange, timely_data])

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
                if (setTheVolume) {
                  setTheVolume(event?.activePayload?.[0]?.payload)
                }
                if (setTheTransaction) {
                  setTheTransaction(event?.activePayload?.[0]?.payload)
                }
                if (setTheFees) {
                  setTheFees(event?.activePayload?.[0]?.payload)
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
                if (setTheFees) {
                  setTheFees(event?.activePayload?.[0]?.payload)
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
                if (setTheFees) {
                  setTheFees(_.last(data))
                }
              }
            }}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            className="mobile-hidden-x"
          >
            <defs>
              <linearGradient id="gradient-vol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="50%" stopColor="#F87171" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#F87171" stopOpacity={0.75} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day_string" axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }}/> 
            <Bar dataKey="volume" minPointSize={5}>
              {data.map((entry, i) => (<Cell key={i} fillOpacity={1} fill="url(#gradient-vol)" />))}
            </Bar>
            {/*<Area type="basis" dataKey="volume" stroke="#B91C1C" fillOpacity={1} fill="url(#gradient-vol)" />*/}
          </BarChart>
          {/*</AreaChart>*/}
        </ResponsiveContainer>
        :
        <div className="skeleton h-full" />
      }
    </div>
  )
}