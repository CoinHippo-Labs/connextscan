import { useState, useEffect, useRef } from 'react'

import TimeRanges from './time-ranges'

export default function DropdownTimeRange({ timeRange, onClick }) {
  const [hidden, setHidden] = useState(true)

  const buttonRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = event => {
      if (
        hidden ||
        buttonRef.current.contains(event.target) ||
        dropdownRef.current.contains(event.target)
      ) {
        return false
      }
      setHidden(!hidden)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [hidden, buttonRef, dropdownRef])

  const handleDropdownClick = () => setHidden(!hidden)

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleDropdownClick}
        className="flex items-center justify-center"
      >
        <div className="min-w-max bg-gray-100 dark:bg-gray-800 rounded-lg font-semibold py-0.5 px-2">
          {timeRange.title}
        </div>
      </button>
      <div
        ref={dropdownRef} 
        className={`dropdown ${hidden ? '' : 'open'} absolute top-0 right-0 mt-6`}
      >
        <div className="dropdown-content w-20 bottom-start">
          <TimeRanges
            handleDropdownClick={_timeRange => {
              if (onClick) {
                onClick(_timeRange)
              }
              handleDropdownClick()
            }}
          />
        </div>
      </div>
    </div>
  )
}