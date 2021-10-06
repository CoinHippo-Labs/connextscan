import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import { FiMenu, FiMoon, FiSun } from 'react-icons/fi'

import Logo from './logo'
import DropdownNavigation from './navigation/dropdown'
import Search from './search'
import Navigation from './navigation'
import Network from './network'

import { THEME } from '../../reducers/types'

export default function Navbar() {
  const dispatch = useDispatch()
  const { preferences } = useSelector(state => ({ preferences: state.preferences }), shallowEqual)
  const { theme } = { ...preferences }

  return (
    <div className="navbar border-b">
      <div className="navbar-inner w-full flex items-center">
        <Logo />
        <DropdownNavigation />
        <Navigation />
        <div className="flex items-center ml-auto">
          <Search />
          <Network />
          <button
            onClick={() =>
              dispatch({
                type: THEME,
                value: theme === 'light' ? 'dark' : 'light'
              })
            }
            className="w-8 sm:w-12 h-16 btn-transparent flex items-center justify-center"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {theme === 'light' ? (
                <FiMoon size={16} />
              ) : (
                <FiSun size={16} />
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}