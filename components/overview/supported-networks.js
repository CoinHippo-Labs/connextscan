import Link from 'next/link'

import { networks } from '../../lib/menus'

export default function SupportedNetworks() {
  return (
    <div className="bg-gray-100 dark:bg-gray-900 -mx-4 py-4 sm:py-12 px-4">
      <h2 className="text-gray-900 dark:text-white text-xl sm:text-center font-semibold">Supported Chains</h2>
      <div className="overflow-x-auto flex flex-row items-center justify-center space-x-2 mt-6 mb-1">
        {networks.filter(network => network?.id && !(network?.disabled)).map((network, i) => (
          <Link key={i} href={network.url}>
            <a href={`-ml-${i === 0 && networks.filter(network => network?.id && !(network?.disabled)).length > 10 ? 0 : 2} sm:ml-0`}>
              <img
                src={network.icon}
                alt=""
                className="w-8 sm:w-12 min-w-max h-8 sm:h-12 rounded-full"
              />
            </a>
          </Link>
        ))}
      </div>
    </div>
  )
}