import { TODAY_DATA } from './types'

export default function data(
  state = {
    [`${TODAY_DATA}`]: null,
  },
  action
) {
  switch (action.type) {
    case TODAY_DATA:
      return {
        ...state,
        [`${TODAY_DATA}`]: action.value
      }
    default:
      return state
  }
}