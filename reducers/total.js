import { TOTAL_DATA } from './types'

export default function data(
  state = {
    [`${TOTAL_DATA}`]: null,
  },
  action
) {
  switch (action.type) {
    case TOTAL_DATA:
      return {
        ...state,
        [`${TOTAL_DATA}`]: action.value
      }
    default:
      return state
  }
}