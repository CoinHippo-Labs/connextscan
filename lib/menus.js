import { FiServer, FiBox, FiFile, FiKey } from 'react-icons/fi'
import { BiWallet } from 'react-icons/bi'
import { RiRadioButtonLine } from 'react-icons/ri'
import { HiCode } from 'react-icons/hi'

export const navigations = [
  {
    id: 'validators',
    title: 'Validators',
    path: '/validators',
    icon: <FiServer size={16} className="stroke-current" />,
  },
  {
    id: 'blocks',
    title: 'Blocks',
    path: '/blocks',
    icon: <FiBox size={16} className="stroke-current" />,
  },
  {
    id: 'transactions',
    title: 'Transactions',
    path: '/transactions',
    icon: <FiFile size={16} className="stroke-current" />,
  },
  {
    id: 'participations',
    title: 'Participations',
    path: '/participations',
    icon: <FiKey size={16} className="stroke-current" />,
  },
  {
    id: 'bridge',
    title: 'Bridge Accounts',
    path: '/bridge',
    icon: <BiWallet size={16} className="stroke-current" />,
  },
]

export const networks = [
  {
    id: 'mainnet',
    title: 'Mainnet',
    icon: <RiRadioButtonLine size={20} className="stroke-current" />,
    url: 'https://axelar.coinhippo.io',
    disabled: true,
  },
  {
    id: 'testnet',
    title: 'Testnet',
    icon: <HiCode size={20} className="stroke-current" />,
    url: 'https://axelar-testnet.coinhippo.io',
  },
]