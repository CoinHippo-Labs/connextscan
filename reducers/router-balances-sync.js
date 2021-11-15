import { ROUTER_BALANCES_SYNC_DATA } from './types'

export default function data(
  state = {
    [`${ROUTER_BALANCES_SYNC_DATA}`]: null,
  },
  action
) {
  switch (action.type) {
    case ROUTER_BALANCES_SYNC_DATA:
      return {
        ...state,
        [`${ROUTER_BALANCES_SYNC_DATA}`]: action.value ? { ...state[`${ROUTER_BALANCES_SYNC_DATA}`], ...action.value } : null
      }
    default:
      return state
  }
}