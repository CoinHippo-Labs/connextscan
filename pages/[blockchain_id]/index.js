import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'
import Web3 from 'web3'
import { utils } from 'ethers'

import Assets from '../../components/assets'
import Transactions from '../../components/transactions'

import { currency_symbol } from '../../lib/object/currency'
import { numberFormat } from '../../lib/utils'

export default function BlockchainIndex() {
  const { chains, routers_assets } = useSelector(state => ({ chains: state.chains, routers_assets: state.routers_assets }), shallowEqual)
  const { chains_data } = { ...chains }
  const { routers_assets_data } = { ...routers_assets }

  const router = useRouter()
  const { query } = { ...router }
  const { blockchain_id } = { ...query }

  const [assetBy, setAssetBy] = useState('assets')
  const [web3, setWeb3] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [addTokenData, setAddTokenData] = useState(null)

  useEffect(() => {
    if (!web3) {
      setWeb3(new Web3(Web3.givenProvider))
    }
    else {
      try {
        web3.currentProvider._handleChainChanged = e => {
          try {
            setChainId(Web3.utils.hexToNumber(e?.chainId))
          } catch (error) {}
        }
      } catch (error) {}
    }
  }, [web3])

  useEffect(() => {
    if (addTokenData?.chain_id === chainId && addTokenData?.contract) {
      addTokenToMetaMask(addTokenData.chain_id, addTokenData.contract)
    }
  }, [chainId, addTokenData])

  const addTokenToMetaMask = async (chain_id, contract) => {
    if (web3 && contract) {
      if (chain_id === chainId) {
        try {
          const response = await web3.currentProvider.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC20',
              options: {
                address: contract.contract_address,
                symbol: contract.symbol,
                decimals: contract.contract_decimals,
                image: `${contract.image?.startsWith('/') ? process.env.NEXT_PUBLIC_SITE_URL : ''}${contract.image}`,
              },
            },
          })
        } catch (error) {}

        setAddTokenData(null)
      }
      else {
        switchNetwork(chain_id, contract)
      }
    }
  }

  const switchNetwork = async (chain_id, contract) => {
    try {
      await web3.currentProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: utils.hexValue(chain_id) }],
      })
    } catch (error) {
      if (error.code === 4902) {
        try {
          await web3.currentProvider.request({
            method: 'wallet_addEthereumChain',
            params: chains_data?.find(c => c.chain_id === chain_id)?.provider_params,
          })
        } catch (error) {}
      }
    }

    if (contract) {
      setAddTokenData({ chain_id, contract })
    }
  }

  const chain = chains_data?.find(c => c?.id === blockchain_id)
  if (blockchain_id && chains_data && !chain) {
    router.push('/')
  }
  const hasLiquidity = routers_assets_data?.findIndex(ra => ra?.asset_balances?.findIndex(ab => ab?.chain?.chain_id === chain?.chain_id) > -1) > -1

  return (
    <>
      <div className="max-w-8xl space-y-4 sm:space-y-8 my-2 xl:mt-4 xl:mb-6 mx-auto">
        <div className="flex items-center">
          <div className="flex items-center space-x-1">
            {['assets', 'routers'].map((a, i) => (
              <div
                key={i}
                onClick={() => setAssetBy(a)}
                className={`btn btn-lg btn-rounded cursor-pointer bg-trasparent ${a === assetBy ? 'bg-gray-100 dark:bg-gray-900 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-400 hover:text-black dark:text-gray-600 dark:hover:text-white'}`}
              >
                {a}
              </div>
            ))}
          </div>
          {hasLiquidity && (
            <div className="text-right space-y-1 ml-auto">
              <div className="whitespace-nowrap uppercase text-gray-400 dark:text-gray-600 font-medium">Available Liquidity</div>
              <div className="font-mono font-semibold">
                {currency_symbol}{numberFormat(_.sumBy(routers_assets_data.flatMap(ra => ra?.asset_balances?.filter(ab => ab?.chain?.chain_id === chain?.chain_id) || []), 'amount_value'), '0,0')}
              </div>
            </div>
          )}
        </div>
        <Assets assetBy={assetBy} addTokenToMetaMaskFunction={addTokenToMetaMask} />
        <div className="max-w-6xl mx-auto">
          <Transactions addTokenToMetaMaskFunction={addTokenToMetaMask} className="no-border" />
        </div>
      </div>
    </>
  )
}