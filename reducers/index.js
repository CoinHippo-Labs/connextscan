import { combineReducers } from 'redux'

import preferences from './preferences'
import data from './data'
import contracts from './contracts'
import assets from './assets'
import timely from './timely'
import total from './total'
import wallet from './wallet'

export default combineReducers({
  preferences,
  data,
  contracts,
  assets,
  timely,
  total,
  wallet,
})