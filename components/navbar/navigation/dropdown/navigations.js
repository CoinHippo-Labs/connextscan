import Link from 'next/link'
import { useRouter } from 'next/router'

import { navigations } from '../../../../lib/menus'

export default function Navigations({ handleDropdownClick }) {
  const router = useRouter()
  const { pathname } = { ...router }

  return (
    <div className="flex flex-wrap">
      {navigations.map((item, i) => (
        <Link key={i} href={item.path}>
          <a
            onClick={handleDropdownClick}
            className={`dropdown-item w-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center uppercase space-x-1 p-3 ${pathname === item.path ? 'text-gray-900 hover:text-gray-800 dark:text-gray-100 dark:hover:text-gray-200 font-bold' : 'text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium'}`}
          >
            {item.icon}
            <span className="text-xs">{item.title}</span>
          </a>
        </Link>
      ))}
    </div>
  )
}