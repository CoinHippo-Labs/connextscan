import { useSelector, shallowEqual } from 'react-redux'

import { numberFormat } from '../../../../lib/utils'

export default function TotalTransaction({ className = '' }) {
  const { total } = useSelector(state => ({ total: state.total }), shallowEqual)
  const { total_data } = { ...total }

  return (
    <div className="max-h-full flex flex-col py-4">
      {total_data ?
        <div className="flex items-center text-2xl sm:text-xl lg:text-2xl">
          <span className="font-semibold">{numberFormat(total_data.tx_count, '0,0')}</span>
          {/*typeof total_data?.tx_count_percentage_change === 'number' && (
            <span className={`${total_data.tx_count_percentage_change > 0 ? 'text-green-500' : total_data.tx_count_percentage_change < 0 ? 'text-red-500' : 'text-gray-400 dark:text-gray-600'} text-base ml-auto`}>{numberFormat(total_data.tx_count_percentage_change, '+0,0.000')}%</span>
          )*/}
        </div>
        :
        <div className="skeleton w-40 h-8" />
      }
    </div>
  )
}