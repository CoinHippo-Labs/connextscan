import { combineReducers } from 'redux'

import preferences from './preferences'
import chains from './chains'
import assets from './assets'
import tokens from './tokens'
import ens from './ens'
import status from './status'
import chains_status from './chains-status'
import routers_status from './routers-status'
import asset_balances from './asset-balances'
import stats from './stats'
import sdk from './sdk'
import rpcs from './rpcs'
import wallet from './wallet'

export default combineReducers({
  preferences,
  chains,
  assets,
  tokens,
  ens,
  status,
  chains_status,
  routers_status,
  asset_balances,
  stats,
  sdk,
  rpcs,
  wallet,
})