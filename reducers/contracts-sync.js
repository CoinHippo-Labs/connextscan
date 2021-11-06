import _ from 'lodash'

import { CONTRACTS_SYNC_DATA } from './types'

export default function data(
  state = {
    [`${CONTRACTS_SYNC_DATA}`]: null,
  },
  action
) {
  switch (action.type) {
    case CONTRACTS_SYNC_DATA:
      return {
        ...state,
        [`${CONTRACTS_SYNC_DATA}`]: _.uniqBy(_.concat(action.value || [], state[`${CONTRACTS_SYNC_DATA}`] || []), 'id')
      }
    default:
      return state
  }
}