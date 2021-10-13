import { useSelector, shallowEqual } from 'react-redux'

import { numberFormat } from '../../../../lib/utils'

export default function TodayTransaction({ className = '' }) {
  const { today } = useSelector(state => ({ today: state.today }), shallowEqual)
  const { today_data } = { ...today }

  return (
    <div className="max-h-full flex flex-col py-4">
      {today_data ?
        <div className="text-2xl sm:text-xl lg:text-2xl font-semibold">
          {numberFormat(today_data.transaction, '0,0')}
        </div>
        :
        <div className="skeleton w-40 h-8" />
      }
    </div>
  )
}