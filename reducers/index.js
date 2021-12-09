import { combineReducers } from 'redux'

import preferences from './preferences'
import data from './data'
import contracts from './contracts'
import contracts_sync from './contracts-sync'
import assets from './assets'
import assets_sync from './assets-sync'
import ens from './ens'
import router_balances_sync from './router-balances-sync'
import routers_status from './routers-status'
import timely from './timely'
import timely_sync from './timely-sync'
import total from './total'
import wallet from './wallet'

export default combineReducers({
  preferences,
  data,
  contracts,
  contracts_sync,
  assets,
  assets_sync,
  ens,
  router_balances_sync,
  routers_status,
  timely,
  timely_sync,
  total,
  wallet,
})