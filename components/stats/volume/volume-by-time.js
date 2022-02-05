import { useSelector, shallowEqual } from 'react-redux'

import {
  ResponsiveContainer,
  BarChart,
  linearGradient,
  stop,
  XAxis,
  Bar,
  Cell,
} from 'recharts'
import Loader from 'react-loader-spinner'

export default function VolumeByTime({ data, selectTime }) {
  const { preferences } = useSelector(state => ({ preferences: state.preferences }), shallowEqual)
  const { theme } = { ...preferences }

  const loaded = !!data

  return (
    <div className="w-full h-60">
      {loaded ?
        <ResponsiveContainer>
          <BarChart
            data={data}
            onMouseEnter={event => {
              if (event) {
                if (selectTime) {
                  selectTime(event?.activePayload?.[0]?.payload?.time)
                }
              }
            }}
            onMouseMove={event => {
              if (event) {
                if (selectTime) {
                  selectTime(event?.activePayload?.[0]?.payload?.time)
                }
              }
            }}
            onMouseLeave={() => {
              if (event) {
                if (selectTime) {
                  selectTime(null)
                }
              }
            }}
            margin={{ top: 10, right: 0, left: 0, bottom: -8 }}
            className="mobile-hidden-x"
          >
            <defs>
              <linearGradient id="gradient-vol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="50%" stopColor="#F87171" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#F87171" stopOpacity={0.75} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time_string" axisLine={false} tickLine={false} />
            <Bar dataKey="volume_value" minPointSize={5}>
              {data.map((entry, i) => (<Cell key={i} fillOpacity={1} fill="url(#gradient-vol)" />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        :
        <div className="w-full h-56 flex items-center justify-center">
          <Loader type="Oval" color={theme === 'dark' ? 'white' : '#3B82F6'} width="24" height="24" />
        </div>
      }
    </div>
  )
}