import { TIMELY_SYNC_DATA } from './types'

export default function data(
  state = {
    [`${TIMELY_SYNC_DATA}`]: null,
  },
  action
) {
  switch (action.type) {
    case TIMELY_SYNC_DATA:
      return {
        ...state,
        [`${TIMELY_SYNC_DATA}`]: { ...state[`${TIMELY_SYNC_DATA}`], ...action.value }
      }
    default:
      return state
  }
}