import { combineReducers } from 'redux'

import preferences from './preferences'
import chains from './chains'
import tokens from './tokens'
import ens from './ens'
import status from './status'
import chains_status from './chains-status'
import routers_status from './routers-status'
import asset_balances from './asset-balances'
import routers_assets from './routers-assets'
import stats from './stats'
import transactions from './transactions'
import sdk from './sdk'
import rpcs from './rpcs'
import wallet from './wallet'

export default combineReducers({
  preferences,
  chains,
  tokens,
  ens,
  status,
  chains_status,
  routers_status,
  asset_balances,
  routers_assets,
  stats,
  transactions,
  sdk,
  rpcs,
  wallet,
})