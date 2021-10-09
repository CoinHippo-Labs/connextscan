import { combineReducers } from 'redux'

import preferences from './preferences'
import data from './data'
import contracts from './contracts'
import assets from './assets'

export default combineReducers({
  preferences,
  data,
  contracts,
  assets,
})