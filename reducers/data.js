import { CHAIN_DATA, STATUS_DATA } from './types'

export default function data(
  state = {
    [`${CHAIN_DATA}`]: null,
    [`${STATUS_DATA}`]: null,
  },
  action
) {
  switch (action.type) {
    case CHAIN_DATA:
      return {
        ...state,
        [`${CHAIN_DATA}`]: action.value
      }
    case STATUS_DATA:
      return {
        ...state,
        [`${STATUS_DATA}`]: action.value
      }
    default:
      return state
  }
}