import { useSelector, shallowEqual } from 'react-redux'

import { currency_symbol } from '../../../../lib/object/currency'
import { numberFormat } from '../../../../lib/utils'

export default function TotalVolume({ className = '' }) {
  const { total } = useSelector(state => ({ total: state.total }), shallowEqual)
  const { total_data } = { ...total }

  return (
    <div className="max-h-full flex flex-col py-4">
      {total_data ?
        <div className="flex items-center text-2xl sm:text-xl lg:text-2xl">
          <span className="font-mono font-semibold">{currency_symbol}{numberFormat(total_data.volume, '0,0')}</span>
        </div>
        :
        <div className="skeleton w-40 h-8" />
      }
    </div>
  )
}