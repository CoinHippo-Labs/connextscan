import { useSelector, shallowEqual } from 'react-redux'

import { currency_symbol } from '../../../../lib/object/currency'
import { numberFormat } from '../../../../lib/utils'

export default function TodayVolume({ className = '' }) {
  const { today } = useSelector(state => ({ today: state.today }), shallowEqual)
  const { today_data } = { ...today }

  return (
    <div className="max-h-full flex flex-col py-4">
      {today_data ?
        <div className="flex items-center font-mono text-2xl sm:text-xl lg:text-2xl font-semibold">
          <span>{currency_symbol}{numberFormat(today_data.volume, '0,0')}</span>
          {typeof today_data?.volume_percentage_change === 'number' && (
            <span className={`${today_data.volume_percentage_change > 0 ? 'text-green-500' : today_data.volume_percentage_change < 0 ? 'text-red-500' : 'text-gray-400 dark:text-gray-600'} text-base font-normal ml-auto`}>{numberFormat(today_data.volume_percentage_change, '+0,0.000')}%</span>
          )}
        </div>
        :
        <div className="skeleton w-40 h-8" />
      }
    </div>
  )
}