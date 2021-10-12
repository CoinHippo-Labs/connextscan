import { LAST_24H_DATA } from './types'

export default function data(
  state = {
    [`${LAST_24H_DATA}`]: null,
  },
  action
) {
  switch (action.type) {
    case LAST_24H_DATA:
      return {
        ...state,
        [`${LAST_24H_DATA}`]: action.value
      }
    default:
      return state
  }
}