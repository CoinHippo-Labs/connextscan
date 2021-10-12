import { TIMELY_DATA } from './types'

export default function data(
  state = {
    [`${TIMELY_DATA}`]: null,
  },
  action
) {
  switch (action.type) {
    case TIMELY_DATA:
      return {
        ...state,
        [`${TIMELY_DATA}`]: action.value
      }
    default:
      return state
  }
}