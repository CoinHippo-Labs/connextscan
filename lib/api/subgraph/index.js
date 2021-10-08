import { networks } from '../../menus'
import { getChainTx, getFromAddress } from '../../object/tx'
import { getRequestUrl } from '../../utils'

const api_name = 'subgraph'

const request = async (path, params) => {
  const res = await fetch(getRequestUrl(process.env.NEXT_PUBLIC_API_URL, path, { ...params, api_name }))
  return await res.json()
}

export const graphql = async params => {
  const path = ''
  return await request(path, params)
}

export const routers = async (params, contracts) => {
  const response = await graphql({ ...params, query: `
    {
      routers {
        id
        assetBalances(orderBy: amount, orderDirection: desc) {
          id,
          amount
        }
      }
    }
  ` })

  return {
    data: response?.data?.routers?.map(router => {
      return {
        ...router,
        assetBalances: router?.assetBalances?.map(assetBalance => {
          return {
            ...assetBalance,
            data: contracts?.find(contract => contract.id === assetBalance?.id?.replace(`-${router.id}`, ''))?.data,
          }
        }),
      }
    })
  }
}

export const transactions = async (params, contracts) => {
  const response = await graphql({ ...params, query: `
    {
      transactions(orderBy: preparedTimestamp, orderDirection: desc) {
        id
        status
        preparedTimestamp
        receivingChainTxManagerAddress
        user {
          id
        }
        router {
          id
        }
        initiator
        sendingAssetId
        receivingAssetId
        sendingChainFallback
        callTo
        receivingAddress
        callDataHash
        transactionId
        sendingChainId
        receivingChainId
        amount
        expiry
        preparedBlockNumber
        encryptedCallData
        prepareCaller
        bidSignature
        encodedBid
        prepareTransactionHash
        prepareMeta
        relayerFee
        signature
        callData
        externalCallSuccess
        externalCallIsContract
        externalCallReturnData
        fulfillCaller
        fulfillTransactionHash
        fulfillMeta
        cancelCaller
        cancelTransactionHash
        cancelMeta
      }
    }
  ` })

  return {
    data: response?.data?.transactions?.map(transaction => {
      return {
        ...transaction,
        chainTx: getChainTx(transaction),
        preparedTimestamp: Number(transaction.preparedTimestamp) * 1000,
        sendingAddress: getFromAddress(transaction),
        sendingChainId: Number(transaction.sendingChainId),
        sendingChain: networks.find(network => network.network_id === Number(transaction.sendingChainId)),
        sendingAsset: contracts?.find(contract => contract.id === transaction.sendingAssetId)?.data,
        receivingChainId: Number(transaction.receivingChainId),
        receivingChain: networks.find(network => network.network_id === Number(transaction.receivingChainId)),
        receivingAsset: contracts?.find(contract => contract.id === transaction.receivingAssetId)?.data,
      }
    })
  }
}