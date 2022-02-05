import { RiBarChartBoxLine } from 'react-icons/ri'
import { MdOutlineRouter, MdOutlineTableChart } from 'react-icons/md'
import { BiFileBlank } from 'react-icons/bi'
import { IoRadioButtonOn } from 'react-icons/io5'

export const navigations = [
  {
    id: 'overview',
    title: 'Overview',
    path: '/',
    icon: <RiBarChartBoxLine size={16} className="stroke-current" />,
  },
  {
    id: 'routers',
    title: 'Routers',
    path: '/routers',
    icon: <MdOutlineRouter size={16} className="stroke-current" />,
  },
  {
    id: 'leaderboard-routers',
    title: 'Leaderboard',
    path: '/leaderboard/routers',
    icon: <MdOutlineTableChart size={16} className="stroke-current" />,
  },
  {
    id: 'transactions',
    title: 'Transactions',
    path: '/transactions',
    icon: <BiFileBlank size={16} className="stroke-current" />,
  },
  {
    id: 'status',
    title: 'Status',
    path: '/status',
    icon: <IoRadioButtonOn size={16} className="stroke-current" />,
  },
]