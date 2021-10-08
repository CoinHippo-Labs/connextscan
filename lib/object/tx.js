export const getChainTx = data => {
  switch (data?.status) {
    case 'Fulfilled':
      return data?.fulfillTransactionHash
    case 'Prepared':
      return data?.prepareTransactionHash
    default:
      return data?.cancelTransactionHash
  }
}

export const getFromAddress = data => {
  switch (data?.status) {
    case 'Fulfilled':
      return data?.fulfillCaller
    case 'Prepared':
      return data?.prepareCaller
    default:
      return data?.cancelCaller
  }
}