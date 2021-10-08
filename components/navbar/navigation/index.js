import Link from 'next/link'
import { useRouter } from 'next/router'

import { navigations } from '../../../lib/menus'

export default function Navigation() {
  const router = useRouter()
  const { pathname } = { ...router }

  return (
    <div className="hidden lg:flex items-center space-x-0 lg:space-x-2 mx-auto xl:ml-20">
      {navigations.map((item, i) => (
        <Link key={i} href={item.path}>
          <a className={`bg-transparent hover:bg-gray-100 dark:hover:bg-gray-900 rounded flex items-center uppercase text-xs xl:text-sm space-x-1 p-2 ${pathname === item.path ? 'text-gray-900 hover:text-gray-800 dark:text-gray-50 dark:hover:text-gray-100 font-bold' : 'text-gray-600 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 font-medium'}`}>
            {item.icon}
            <span>{item.title}</span>
          </a>
        </Link>
      ))}
    </div>
  )
}