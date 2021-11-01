import _ from 'lodash'

import { CONTRACTS_DATA } from './types'

export default function data(
  state = {
    [`${CONTRACTS_DATA}`]: null,
  },
  action
) {
  switch (action.type) {
    case CONTRACTS_DATA:
      return {
        ...state,
        [`${CONTRACTS_DATA}`]: _.uniqBy(_.concat(action.value || [], state[`${CONTRACTS_DATA}`] || []), 'id')
      }
    default:
      return state
  }
}