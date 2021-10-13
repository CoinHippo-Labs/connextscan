import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'
import moment from 'moment'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
} from 'recharts'

import { daily_time_range, day_s } from '../../../../lib/object/timely'

export default function TimelyTransaction({ theTransaction, setTheTransaction }) {
  const { timely } = useSelector(state => ({ timely: state.timely }), shallowEqual)
  const { timely_data } = { ...timely }

  const [data, setData] = useState(null)

  useEffect(() => {
    const today = moment().startOf('day')

    let _data = timely_data && _.orderBy(Object.entries(_.groupBy(Object.values(timely_data).flatMap(timely => timely), 'dayStartTimestamp')).map(([key, value]) => {
      return {
        assets: value && _.groupBy(value, 'chain_data.id'),
        time: _.head(value)?.dayStartTimestamp,
        tx_count: _.sumBy(value, 'txCount'),
      }
    }), ['dayStartTimestamp'], ['asc'])
    .filter(timely => moment(timely.dayStartTimestamp * 1000).diff(moment(today).subtract(daily_time_range, 'days')) >= 0)

    const __data = _data && _.cloneDeep(_data)

    if (__data) {
      _data = []

      for (let time = moment(today).subtract(daily_time_range, 'days').unix(); time <= today.unix(); time += day_s) {
        _data.push(__data.find(timely => timely.dayStartTimestamp === time) || { dayStartTimestamp: time, tx_count: 0 })
      }

      _data = _data.map((timely, i) => { return { ...timely, day_string: i % 2 === 0 && moment(timely.dayStartTimestamp * 1000).format('DD') } })
    
      setData(_data)

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
          <BarChart
            data={data}
            onMouseEnter={event => {
              if (event && setTheTransaction) {
                setTheTransaction(event?.activePayload?.[0]?.payload)
              }
            }}
            onMouseMove={event => {
              if (event && setTheTransaction) {
                setTheTransaction(event?.activePayload?.[0]?.payload)
              }
            }}
            onMouseLeave={() => {
              if (data && setTheTransaction) {
                setTheTransaction(_.last(data))
              }
            }}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            className="mobile-hidden-x"
          >
            <XAxis dataKey="day_string" axisLine={false} tickLine={false} />
            <Bar dataKey="tx_count" minPointSize={5}>
              {data.map((entry, i) => (<Cell key={i} fill="#4F46E5" />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        :
        <div className="skeleton h-full" />
      }
    </div>
  )
}