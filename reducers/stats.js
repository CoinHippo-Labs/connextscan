import { STATS_DATA } from './types'

export default function data(
  state = {
    [`${STATS_DATA}`]: null,
  },
  action
) {
  switch (action.type) {
    case STATS_DATA:
      return {
        ...state,
        [`${STATS_DATA}`]: { ...state[`${STATS_DATA}`], ...action.value },
      }
    default:
      return state
  }
}