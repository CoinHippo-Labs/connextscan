import { ASSETS_SYNC_DATA } from './types'

export default function data(
  state = {
    [`${ASSETS_SYNC_DATA}`]: null,
  },
  action
) {
  switch (action.type) {
    case ASSETS_SYNC_DATA:
      return {
        ...state,
        [`${ASSETS_SYNC_DATA}`]: { ...state[`${ASSETS_SYNC_DATA}`], ...action.value }
      }
    default:
      return state
  }
}