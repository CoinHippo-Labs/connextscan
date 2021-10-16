import { daily_time_ranges } from '../../lib/object/timely'

export default function TimeRanges({ handleDropdownClick }) {
  return (
    <div className="flex flex-wrap">
      {daily_time_ranges.map((item, i) => (
        <div
          key={i}
          title={item?.disabled && 'Not available yet'}
          onClick={() => {
            if (!(item?.disabled) && handleDropdownClick) {
              handleDropdownClick(item)
            }
          }}
          className={`bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-800 w-full ${item?.disabled ? 'cursor-not-allowed' : 'cursor-pointer'} flex items-center justify-start font-medium space-x-1.5 p-2`}
        >
          {item?.title}
        </div>
      ))}
    </div>
  )
}