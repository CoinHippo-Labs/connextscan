import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'
import moment from 'moment'
import { NxtpSdk } from '@connext/nxtp-sdk'
import { providers, constants, Wallet, Contract } from 'ethers'
import BigNumber from 'bignumber.js'
import { FiMenu, FiMoon, FiSun } from 'react-icons/fi'

import Logo from './logo'
import DropdownNavigation from './navigation/dropdown'
import Navigation from './navigation'
import Search from './search'
import Network from './network'
import SubNavbar from './sub-navbar'
// import PageTitle from './page-title'

import { chains as getChains, assets as getAssets } from '../../lib/api/crosschain_config'
import { tokens as getTokens } from '../../lib/api/tokens'
import { domains, getENS } from '../../lib/api/ens'
import { coin } from '../../lib/api/coingecko'
import { assetBalances } from '../../lib/api/subgraph'
import { connext, chainExtraData } from '../../lib/object/chain'

import { THEME, CHAINS_DATA, ASSETS_DATA, TOKENS_DATA, ENS_DATA, STATUS_DATA, CHAINS_STATUS_DATA, ROUTERS_STATUS_DATA, ROUTERS_STATUS_TRIGGER, ASSET_BALANCES_DATA, RPCS_DATA, SDK_DATA } from '../../reducers/types'

export default function Navbar() {
  const dispatch = useDispatch()
  const { preferences, chains, routers_status, sdk } = useSelector(state => ({ preferences: state.preferences, chains: state.chains, routers_status: state.routers_status, sdk: state.sdk }), shallowEqual)
  const { theme } = { ...preferences }
  const { chains_data } = { ...chains }
  const { routers_status_trigger } = { ...routers_status }
  const { sdk_data } = { ...sdk }

  const router = useRouter()
  const { pathname, query } = { ...router }
  const { blockchain_id } = { query }

  useEffect(() => {
    const getData = async () => {
      const response = await getChains()

      dispatch({
        type: CHAINS_DATA,
        value: response || [],
      })
    }

    getData()
  }, [])

  useEffect(() => {
    const getData = async () => {
      const response = await getAssets()

      dispatch({
        type: ASSETS_DATA,
        value: response || [],
      })
    }

    getData()
  }, [])

  useEffect(async () => {
    if (chains_data) {
      const chainConfig = ['testnet'].includes(process.env.NEXT_PUBLIC_NETWORK) ?
        { 1: { providers: ['https://api.mycryptoapi.com/eth', 'https://cloudflare-eth.com'] } }
        :
        {}

      const rpcs = {}

      for (let i = 0; i < chains_data.length; i++) {
        const chain = chains_data[i]

        chainConfig[chain?.chain_id] = {
          providers: chain?.provider_params?.[0]?.rpcUrls?.filter(rpc => rpc && !rpc.startsWith('wss://') && !rpc.startsWith('ws://')) || [],
        }

        rpcs[chain?.chain_id] = new providers.FallbackProvider(chain?.provider_params?.[0]?.rpcUrls?.filter(rpc => rpc && !rpc.startsWith('wss://') && !rpc.startsWith('ws://')).map(rpc => new providers.JsonRpcProvider(rpc)) || [])
      }

      dispatch({
        type: SDK_DATA,
        value: await NxtpSdk.create({ chainConfig, signer: Wallet.createRandom(), skipPolling: false }),
      })

      dispatch({
        type: RPCS_DATA,
        value: rpcs,
      })
    }
  }, [chains_data])

  useEffect(() => {
    const getAssetBalances = async chain => {
      if (chain) {
        const response = await assetBalances({ chain_id: chain.chain_id })
        const data = response?.data?.map(a => { return { ...a, chain } })

        dispatch({
          type: ASSET_BALANCES_DATA,
          value: { [`${chain.chain_id}`]: data },
        })

        const contractAddresses = _.uniq(data?.map(a => a?.contract_address).filter(a => a) || [])
        let tokenContracts

        if (contractAddresses.length > 0) {
          const responseTokens = await getTokens({ chain_id: chain.chain_id, addresses: contractAddresses.join(',') })
          tokenContracts = response?.data?.map(t => { return { ...t, id: `${chain.chain_id}_${t.contract_address}` } })
        }

        dispatch({
          type: TOKENS_DATA,
          value: tokenContracts || [],
        })

        const evmAddresses = _.uniq(data?.map(a => a?.router?.id).filter(id => id) || [])
        if (evmAddresses.length > 0) {
          let ensData

          const addressChunk = _.chunk(evmAddresses, 20)

          for (let i = 0; i < addressChunk.length; i++) {
            const domainsResponse = await domains({ where: `{ resolvedAddress_in: [${addressChunk[i].map(id => `"${id?.toLowerCase()}"`).join(',')}] }` })

            ensData = _.concat(ensData || [], domainsResponse?.data || [])
          }

          if (ensData?.length > 0) {
            const ensResponses = {}

            for (let i = 0; i < evmAddresses.length; i++) {
              const evmAddress = evmAddresses[i]?.toLowerCase()

              if (ensData.filter(domain => domain?.resolvedAddress?.id?.toLowerCase() === evmAddress).length > 1) {
                ensResponses[evmAddress] = await getENS(evmAddress)
              }
            }

            dispatch({
              type: ENS_DATA,
              value: Object.fromEntries(ensData.filter(domain => !ensResponses?.[domain?.resolvedAddress?.id?.toLowerCase()]?.reverseRecord || domain?.name === ensResponses?.[domain?.resolvedAddress?.id?.toLowerCase()].reverseRecord).map(domain => [domain?.resolvedAddress?.id?.toLowerCase(), { ...domain }])),
            })
          }
        }
      }
    }

    const getData = async () => {
      if (chains_data) {
        if (['/', '/routers', '/leaderboard/routers'].includes(pathname)) {
          chains_data.forEach(c => getAssetBalances(c))
        }
      }
    }

    getData()

    const interval = setInterval(() => getData(), 3 * 60 * 1000)
    return () => {
      clearInterval(interval)
    }
  }, [chains_data, pathname])

  useEffect(() => {
    const getData = async () => {
      if (chains_data) {
        const chain = chains_data.find(c => c?.id === blockchain_id?.toLowerCase()) || connext

        if (chain) {
          const extra_data = chainExtraData(chain.chain_id)
          const data = { ...chain, ...extra_data }

          if (extra_data?.coingecko_id) {
            const response = await coin(extra_data.coingecko_id)
            data.token_data = { ...response }
          }

          dispatch({
            type: STATUS_DATA,
            value: { ...data },
          })
        }
      }
    }

    getData()

    const interval = setInterval(() => getData(), 3 * 60 * 1000)
    return () => {
      clearInterval(interval)
    }
  }, [chains_data, blockchain_id])

  useEffect(() => {
    const getData = async () => {
      if (sdk_data) {
        if (routers_status_trigger) {
          dispatch({
            type: ROUTERS_STATUS_DATA,
            value: null,
          })
        }

        const response = await sdk_data.getRouterStatus(process.env.NEXT_PUBLIC_APP_NAME)

        if (response) {
          dispatch({
            type: ROUTERS_STATUS_DATA,
            value: response?.filter(r => r?.supportedChains?.findIndex(id => id && chains_data?.findIndex(c => c?.chain_id === id) > -1) > -1),
          })
        }

        dispatch({
          type: ROUTERS_STATUS_TRIGGER,
          value: null,
        })
      }
    }

    getData()

    const interval = setInterval(() => getData(), 0.5 * 60 * 1000)
    return () => {
      clearInterval(interval)
    }
  }, [sdk_data, routers_status_trigger])

  useEffect(() => {
    const getChainStatus = async chain => {
      if (sdk_data && chain) {
        const response = await sdk_data.getSubgraphSyncStatus(chain.chain_id)

        dispatch({
          type: CHAINS_STATUS_DATA,
          value: response?.latestBlock > -1 && {
            ...chain,
            ...response,
          },
        })
      }
    }

    const getData = async () => {
      if (sdk_data && chains_data) {
        chains_data.filter(c => !c?.disabled).forEach(c => getChainStatus(c))
      }
    }

    setTimeout(() => getData(), 15 * 1000)

    const interval = setInterval(() => getData(), 3 * 60 * 1000)
    return () => {
      clearInterval(interval)
    }
  }, [sdk_data])

  return (
    <>
      <div className="navbar border-b">
        <div className="navbar-inner w-full flex items-center">
          <Logo />
          <DropdownNavigation />
          <Navigation />
          <div className="flex items-center ml-auto">
            <Search />
            <Network />
            <button
              onClick={() => {
                dispatch({
                  type: THEME,
                  value: theme === 'light' ? 'dark' : 'light',
                })
              }}
              className="w-10 sm:w-12 h-16 btn-transparent flex items-center justify-center"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                {theme === 'light' ? (
                  <FiMoon size={16} />
                ) : (
                  <FiSun size={16} />
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
      <SubNavbar />
      {/*<PageTitle />*/}
    </>
  )
}