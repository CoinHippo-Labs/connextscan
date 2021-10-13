import { useSelector, shallowEqual } from 'react-redux'

import { currency_symbol } from '../../../../lib/object/currency'
import { numberFormat } from '../../../../lib/utils'

export default function TodayVolume({ className = '' }) {
  const { today } = useSelector(state => ({ today: state.today }), shallowEqual)
  const { today_data } = { ...today }

  return (
    <div className="max-h-full flex flex-col py-4">
      {today_data ?
        <div className="font-mono text-2xl sm:text-xl lg:text-2xl font-semibold">
          {currency_symbol}{numberFormat(today_data.volume, '0,0')}
        </div>
        :
        <div className="skeleton w-40 h-8" />
      }
    </div>
  )
}