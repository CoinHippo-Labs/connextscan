import { combineReducers } from 'redux'

import preferences from './preferences'
import data from './data'

export default combineReducers({
  preferences,
  data,
})