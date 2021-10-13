import { combineReducers } from 'redux'

import preferences from './preferences'
import data from './data'
import contracts from './contracts'
import assets from './assets'
import timely from './timely'
import today from './today'

export default combineReducers({
  preferences,
  data,
  contracts,
  assets,
  timely,
  today,
})