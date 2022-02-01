import { useRouter } from 'next/router'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import { Img } from 'react-image'
import moment from 'moment'
import Loader from 'react-loader-spinner'
import { MdRefresh } from 'react-icons/md'

import SectionTitle from '../../section-title'
import Copy from '../../copy'

import { ellipseAddress } from '../../../lib/utils'

import { ROUTERS_STATUS_TRIGGER } from '../../../reducers/types'

export default function PageTitle() {
  const dispatch = useDispatch()
  const { preferences, chains, ens, routers_status } = useSelector(state => ({ preferences: state.preferences, chains: state.chains, ens: state.ens, routers_status: state.routers_status }), shallowEqual)
  const { theme } = { ...preferences }
  const { chains_data } = { ...chains }
  const { ens_data } = { ...ens }
  const { routers_status_data } = { ...routers_status }

  const router = useRouter()
  const { pathname, query } = { ...router }
  const { address, tx, blockchain_id } = { ...query }

  let title, subtitle, right

  switch (pathname) {
    case '/':
      title = 'Overview'
      subtitle = 'Dashboard'
      break
    case '/routers':
      title = 'List of routers'
      subtitle = 'Routers'
      break
    case '/leaderboard/routers':
      title = 'Routers'
      subtitle = 'Leaderboard'
      right = (
        <button
          disabled={!routers_status_data}
          onClick={() => {
           dispatch({
              type: ROUTERS_STATUS_TRIGGER,
              value: moment().valueOf(),
            })
          }}
          className={`hover:bg-gray-100 dark:hover:bg-gray-900 ${!routers_status_data ? 'cursor-not-allowed text-gray-800 dark:text-gray-200' : ''} rounded-xl flex items-center font-medium space-x-1 -mr-2 py-1.5 px-2`}
        >
          {routers_status_data ?
            <MdRefresh size={16} />
            :
            <Loader type="Oval" color={theme === 'dark' ? '#F9FAFB' : '#3B82F6'} width="16" height="16" />
          }
          <span>{routers_status_data ? 'Refresh' : 'Loading'}</span>
        </button>
      )
      break
    case '/transactions':
      title = 'Latest'
      subtitle = 'Transactions'
      break
    case '/status':
      title = 'Supported Chains'
      subtitle = 'Status'
      break
    case '/tx/[tx]':
      title = 'Transaction'
      subtitle = (
        <div className="flex items-center space-x-2 xl:space-x-0">
          <span className="xl:hidden uppercase text-sm xl:text-lg">
            {ellipseAddress(tx, 16)}
          </span>
          <span className="hidden xl:block uppercase text-sm xl:text-lg xl:pr-2">
            {ellipseAddress(tx, 24)}
          </span>
          <Copy size={20} text={address} />
        </div>
      )
      break
    case '/router/[address]':
      title = (
        <span className="flex flex-wrap items-center">
          <span className="mr-2">Router</span>
          {ens_data?.[address?.toLowerCase()] && (
            <span className="font-semibold">
              {ellipseAddress(ens_data[address.toLowerCase()], 16)}
            </span>
          )}
        </span>
      )
      subtitle = (
        <div className="flex items-center space-x-2 xl:space-x-0">
          <span className="xl:hidden uppercase text-sm xl:text-lg">
            {ellipseAddress(address, 12)}
          </span>
          <span className="hidden xl:block uppercase text-sm xl:text-lg xl:pr-2">
            {ellipseAddress(address, 16)}
          </span>
          <Copy size={20} text={address} />
        </div>
      )
      break
    case '/address/[address]':
      title = (
        <span className="flex flex-wrap items-center">
          <span className="mr-2">Address</span>
          {ens_data?.[address?.toLowerCase()] && (
            <span className="font-semibold">
              {ellipseAddress(ens_data[address.toLowerCase()], 16)}
            </span>
          )}
        </span>
      )
      subtitle = (
        <div className="flex items-center space-x-2 xl:space-x-0">
          <span className="xl:hidden uppercase text-sm xl:text-lg">
            {ellipseAddress(address, 12)}
          </span>
          <span className="hidden xl:block uppercase text-sm xl:text-lg xl:pr-2">
            {ellipseAddress(address, 16)}
          </span>
          <Copy size={20} text={address} />
        </div>
      )
      break
    case '/[blockchain_id]':
      const chain = chains_data?.find(c => c?.id === blockchain_id?.toLowerCase())

      title = chain?.title || 'chain'
      subtitle = (
        <div className="flex items-center space-x-2">
          <Img
            src={chain?.image}
            alt=""
            className="w-8 h-8 rounded-full"
          />
          <span>{chain?.short_name || blockchain_id}</span>
        </div>
      )
      break
    default:
      break
  }

  return (
    <SectionTitle
      title={title}
      subtitle={<div className="mt-1">{subtitle}</div>}
      right={right}
      className="flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 px-2 sm:px-4"
    />
  )
}