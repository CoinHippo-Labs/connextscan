import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import { NxtpSdk } from '@connext/nxtp-sdk'
import { decodeAuctionBid } from '@connext/nxtp-utils'
import { providers } from 'ethers'
import moment from 'moment'
import { Img } from 'react-image'
import Loader from 'react-loader-spinner'
import Switch from 'react-switch'
import { MdOutlineRouter, MdPending, MdInfoOutline } from 'react-icons/md'
import { TiArrowRight } from 'react-icons/ti'
import { FaCheckCircle, FaClock, FaTimesCircle, FaQuestion } from 'react-icons/fa'
import { BsFileEarmarkX } from 'react-icons/bs'

import Copy from '../../copy'
import Widget from '../../widget'
import Modal from '../../modals/modal-info'
import ModalConfirm from '../../modals/modal-confirm'
import Notification from '../../notifications'
import Alert from '../../alerts'
import Wallet from '../../wallet'
import { ProgressBar } from '../../progress-bars'

import { networks } from '../../../lib/menus'
import { currency_symbol } from '../../../lib/object/currency'
import { numberFormat, ellipseAddress, convertToJson } from '../../../lib/utils'

export default function Transaction({ data, className = '' }) {
  const { preferences, wallet, ens } = useSelector(state => ({ preferences: state.preferences, wallet: state.wallet, ens: state.ens }), shallowEqual)
  const { theme } = { ...preferences }
  const { wallet_data } = { ...wallet }
  const { provider, web3_provider, signer, chain_id, address } = { ...wallet_data }
  const { ens_data } = { ...ens }

  const router = useRouter()
  const { query } = { ...router }
  const { tx } = { ...query }

  const [transfering, setTransfering] = useState(null)
  const [result, setResult] = useState(null)
  const [startTransferTime, setStartTransferTime] = useState(null)
  const [decoded, setDecoded] = useState(false)
  const [decodedBid, setDecodedBid] = useState(null)

  const { sender, receiver } = { ...data?.data }
  const general = receiver || sender

  useEffect(() => {
    if (general && !decodedBid && convertToJson(decodeAuctionBid(general.encodedBid))) {
      const ReactJson = typeof window !== 'undefined' && dynamic(import('react-json-view'))

      setDecodedBid(<ReactJson src={convertToJson(decodeAuctionBid(general.encodedBid))} collapsed={false} theme={theme === 'dark' ? 'shapeshifter' : 'rjv-default'} />)
    }
  }, [general, decodedBid])

  const transfer = async (action, txData, side) => {
    if (chain_id && signer && txData) {
      const chainConfig = {}

      chainConfig[txData.sendingChainId] = {
        provider: new providers.FallbackProvider(
          networks.find(_network => _network.network_id === txData.sendingChainId)?.provider_params?.[0]?.rpcUrls?.filter(rpc => rpc && !rpc.startsWith('wss://') && !rpc.startsWith('ws://'))
            .map(rpc => new providers.JsonRpcProvider(rpc))
          ||
          []
        ),
        providers: networks.find(_network => _network.network_id === txData.sendingChainId)?.provider_params?.[0]?.rpcUrls?.filter(rpc => rpc && !rpc.startsWith('wss://') && !rpc.startsWith('ws://')) || []
      }

      chainConfig[txData.receivingChainId] = {
        provider: new providers.FallbackProvider(
          networks.find(_network => _network.network_id === txData.receivingChainId)?.provider_params?.[0]?.rpcUrls?.filter(rpc => rpc && !rpc.startsWith('wss://') && !rpc.startsWith('ws://'))
            .map(rpc => new providers.JsonRpcProvider(rpc))
          ||
          []
        ),
        providers: networks.find(_network => _network.network_id === txData.receivingChainId)?.provider_params?.[0]?.rpcUrls?.filter(rpc => rpc && !rpc.startsWith('wss://') && !rpc.startsWith('ws://')) || []
      }

      if (chainConfig?.[networks?.find(_network => _network.id === 'opt')?.network_id]) {
        const _network = networks?.find(_network => _network.id === 'eth')

        chainConfig[_network.network_id] = {
          provider: new providers.FallbackProvider(
            _network?.provider_params?.[0]?.rpcUrls?.filter(rpc => rpc && !rpc.startsWith('wss://') && !rpc.startsWith('ws://'))
              .map(rpc => new providers.JsonRpcProvider(rpc))
            ||
            []
          ),
          providers: _network?.provider_params?.[0]?.rpcUrls?.filter(rpc => rpc && !rpc.startsWith('wss://') && !rpc.startsWith('ws://')) || []
        }
      }

      const sdk = await NxtpSdk.create({ chainConfig, signer })

      let response

      setResult(null)
      setTransfering(action)
      setStartTransferTime(moment().valueOf())

      try {
        if (action === 'cancel') {
          const signature = '0x'

          response = await sdk.cancel({
            txData: {
              ...txData,
              user: txData.user?.id,
              router: txData.router?.id,
              preparedBlockNumber: Number(txData.preparedBlockNumber),
              expiry: txData.expiry / 1000,
            },
            signature,
          }, side === 'sender' ? txData.sendingChainId : txData.receivingChainId)
        }
        else {
          response = await sdk.fulfillTransfer({
            txData: {
              ...txData,
              user: txData.user?.id,
              router: txData.router?.id,
              preparedBlockNumber: Number(txData.preparedBlockNumber),
              expiry: txData.expiry / 1000,
            },
            encryptedCallData: txData.encryptedCallData,
            encodedBid: txData.encodedBid,
            bidSignature: txData.bidSignature,
          }, 0, false)
        }

        if (response?.transactionHash || response?.fulfillResponse?.hash || response?.hash) {
          response = {
            ...response,
            message: <div className="flex items-center space-x-1.5">
              <span>Wait for Confirmation.</span>
              {side === 'sender' ?
                txData.sendingChain?.explorer?.url && (
                  <a
                    href={`${txData.sendingChain.explorer.url}${txData.sendingChain.explorer.transaction_path?.replace('{tx}', response?.transactionHash || response?.fulfillResponse?.hash || response?.hash)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center font-semibold"
                  >
                    <span>View on {txData.sendingChain.explorer.name}</span>
                    <TiArrowRight size={20} className="transform -rotate-45" />
                  </a>
                )
                :
                txData.receivingChain?.explorer?.url && (
                  <a
                    href={`${txData.receivingChain.explorer.url}${txData.receivingChain.explorer.transaction_path?.replace('{tx}', response?.transactionHash || response?.fulfillResponse?.hash || response?.hash)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center font-semibold"
                  >
                    <span>View on {txData.receivingChain.explorer.name}</span>
                    <TiArrowRight size={20} className="transform -rotate-45" />
                  </a>
                )
              }
            </div>,
            side,
          }
        }
      } catch (error) {
        response = { error }
      }

      setResult(response)
      setTransfering(null)
      setStartTransferTime(null)
    }
  }

  const canCancelSender = sender?.status === 'Prepared' && moment().valueOf() >= sender.expiry && !(result && !result.error)
  const canDoAction = !canCancelSender && receiver?.status === 'Prepared' && !(result && !result.error)
  const canFulfill = canDoAction && moment().valueOf() < receiver.expiry
  const isActionBeta = false && canCancelSender
  let mustSwitchNetwork = false

  const actionButtons = []

  if (canCancelSender || canDoAction) {
    if (web3_provider) {
      if (address?.toLowerCase() !== (canCancelSender ? sender?.sendingAddress?.toLowerCase() : receiver?.sendingAddress?.toLowerCase())) {
        actionButtons.push(
          <span key={actionButtons.length} className="min-w-max flex flex-col text-gray-400 dark:text-gray-500 text-xs font-light text-right">
            <span>address not match.</span>
            <span className="flex items-center">(Your<span className="hidden sm:block ml-1">connected addr</span>: {ellipseAddress(ens_data?.[address?.toLowerCase()]?.name, 10) || ellipseAddress(address?.toLowerCase(), 6)})</span>
          </span>
        )
      }
      else {
        if (typeof chain_id === 'number' && chain_id !== (canCancelSender ? sender?.sendingChainId : receiver?.receivingChainId)) {
          mustSwitchNetwork = true
        }
        else {
          if (transfering && startTransferTime) {
            actionButtons.push(
              <div key={actionButtons.length} className="w-32 sm:w-40 space-y-1">
                <div className="w-full flex items-center justify-center text-blue-500 dark:text-blue-400 space-x-1">
                  <span className="font-semibold">{/*transfering*/}Waiting to Sign</span>
                  <Loader type="ThreeDots" color={theme === 'dark' ? '#60A5FA' : '#3B82F6'} width="16" height="16" className="mt-1" />
                </div>
                {/*<ProgressBar
                  width={moment().diff(moment(startTransferTime), 'seconds') * 100 / 300}
                  color="bg-blue-500 dark:bg-blue-400"
                  backgroundClassName="bg-gray-50 dark:bg-gray-800"
                  className="h-1"
                />*/}
              </div>
            )
          }
          else {
            actionButtons.push(
              <ModalConfirm
                key={actionButtons.length}
                buttonTitle={<>
                  {transfering === 'cancel' && (
                    <Loader type="Oval" color={theme === 'dark' ? 'white' : 'gray'} width="16" height="16" className={`mb-0.5 ${isActionBeta ? 'mr-1.5' : ''}`} />
                  )}
                  <span>Cancel</span>
                  {isActionBeta && (
                    <span className="bg-red-500 absolute rounded-md inline-flex items-center justify-center uppercase text-white text-2xs font-semibold text-center -mt-9 ml-7 py-0.5 px-1">Beta</span>
                  )}
                </>}
                buttonClassName={`bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 ${transfering ? 'pointer-events-none' : ''} rounded-2xl flex items-center font-semibold ${isActionBeta ? '' : 'space-x-1.5'} py-1 sm:py-1.5 px-2 sm:px-3`}
                title="Cancel Transaction"
                body={<div className="flex flex-col space-y-2 sm:space-y-3 mt-2 -mb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1 xl:space-x-2">
                    <div className="flex items-center text-gray-400 dark:text-gray-500">
                      Address
                      <span className="hidden sm:block">:</span>
                    </div>
                    {general && (<div className="flex items-center space-x-1.5 sm:space-x-1 xl:space-x-1.5">
                      {ens_data?.[general.receivingAddress?.toLowerCase()]?.name && (
                        <Img
                          src={`${process.env.NEXT_PUBLIC_ENS_AVATAR_URL}/${ens_data?.[general.receivingAddress.toLowerCase()].name}`}
                          alt=""
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <Link href={`/address/${general.receivingAddress}`}>
                        <a className="text-gray-400 dark:text-gray-200 text-base sm:text-xs xl:text-base font-medium">
                          {ellipseAddress(ens_data?.[general.receivingAddress?.toLowerCase()]?.name, 10) || ellipseAddress(general.receivingAddress?.toLowerCase(), 10)}
                        </a>
                      </Link>
                      <Copy size={18} text={general.receivingAddress} />
                      {general.receivingChain?.explorer?.url && (
                        <a
                          href={`${general.receivingChain.explorer.url}${general.receivingChain.explorer.address_path?.replace('{address}', general.receivingAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-white"
                        >
                          {general.receivingChain.explorer.icon ?
                            <img
                              src={general.receivingChain.explorer.icon}
                              alt=""
                              className="w-5 sm:w-4 xl:w-5 h-5 sm:h-4 xl:h-5 rounded-full opacity-60 hover:opacity-100"
                            />
                            :
                            <TiArrowRight size={20} className="transform -rotate-45" />
                          }
                        </a>
                      )}
                    </div>)}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1 xl:space-x-2">
                    <div className="flex items-center text-gray-400 dark:text-gray-500">
                      Amount Sent
                      <span className="hidden sm:block">:</span>
                    </div>
                    {sender?.normalize_amount && (
                      <div className="max-w-min bg-gray-100 dark:bg-gray-800 rounded text-sm space-x-1 py-1 px-2">
                        <span className="font-semibold">{numberFormat(sender.normalize_amount, '0,0.00000000', true)}</span>
                        <span className="uppercase text-gray-600 dark:text-gray-400">{sender.sendingAsset?.contract_ticker_symbol || sender.receivingAsset?.contract_ticker_symbol}</span>
                      </div>
                    )}
                  </div>
                  {receiver && (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1 xl:space-x-2">
                        <div className="flex items-center text-gray-400 dark:text-gray-500">
                          Amount Received
                          <span className="hidden sm:block">:</span>
                        </div>
                        {receiver?.normalize_amount && (
                          <div className="max-w-min bg-gray-100 dark:bg-gray-800 rounded text-sm space-x-1 py-1 px-2">
                            <span className="font-semibold">{numberFormat(receiver.normalize_amount, '0,0.00000000', true)}</span>
                            <span className="uppercase text-gray-600 dark:text-gray-400">{receiver.receivingAsset?.contract_ticker_symbol || receiver.sendingAsset?.contract_ticker_symbol}</span>
                          </div>
                        )}
                      </div>
                      {false && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1 xl:space-x-2">
                          <div className="flex items-center text-gray-400 dark:text-gray-500">
                            Fees
                            <span className="hidden sm:block">:</span>
                          </div>
                          {receiver?.value && sender?.value && (
                            <div className="max-w-min bg-gray-100 dark:bg-gray-800 rounded text-sm space-x-1 py-1 px-2">
                              <span className="font-semibold">{currency_symbol}{numberFormat(sender.value - receiver.value, '0,0.00000000')}</span>
                              {/*<span className="uppercase text-gray-600 dark:text-gray-400">{receiver.receivingAsset?.contract_ticker_symbol || receiver.sendingAsset?.contract_ticker_symbol}</span>*/}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex items-center space-x-2 mx-auto py-2">
                    {data ?
                      general?.sendingChain && (
                        <img
                          src={general.sendingChain.icon}
                          alt=""
                          className="w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6 rounded-full"
                        />
                      )
                      :
                      <div className="skeleton w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6" style={{ borderRadius: '100%' }} />
                    }
                    <TiArrowRight size={24} className="transform text-gray-400 dark:text-gray-500" />
                    <img
                      src={networks.find(network => network.id === '')?.icon}
                      alt=""
                      className="w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6 rounded-full"
                    />
                    <TiArrowRight size={24} className="transform text-gray-400 dark:text-gray-500" />
                    {data ?
                      general?.receivingChain && (
                        <img
                          src={general.receivingChain.icon}
                          alt=""
                          className="w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6 rounded-full"
                        />
                      )
                      :
                      <div className="skeleton w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6" style={{ borderRadius: '100%' }} />
                    }
                  </div>
                  <div>Do you want to cancel this transaction?</div>
                </div>}
                cancelButtonTitle="No"
                confirmButtonTitle="Yes, cancel it"
                onConfirm={() => transfer('cancel', canCancelSender ? sender : receiver, canCancelSender ? 'sender' : 'receiver')}
              />
            )

            if (canFulfill) {
              actionButtons.push(
                <ModalConfirm
                  key={actionButtons.length}
                  buttonTitle={<>
                    {transfering === 'fulfill' && (
                      <Loader type="Oval" color="white" width="16" height="16" className={`mb-0.5 ${isActionBeta ? 'mr-1.5' : ''}`} />
                    )}
                    <span>Fulfill</span>
                    {isActionBeta && (
                      <span className="bg-red-500 absolute rounded-md inline-flex items-center justify-center uppercase text-white text-2xs font-semibold text-center -mt-9 ml-5 py-0.5 px-1">Beta</span>
                    )}
                  </>}
                  buttonClassName={`bg-green-400 hover:bg-green-500 dark:bg-green-600 dark:hover:bg-green-500 ${transfering ? 'pointer-events-none' : ''} rounded-2xl flex items-center text-white font-semibold ${isActionBeta ? '' : 'space-x-1.5'} py-1 sm:py-1.5 px-2 sm:px-3`}
                  title="Fulfill Confirmation"
                  body={<div className="flex flex-col space-y-2 sm:space-y-3 mt-2 -mb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1 xl:space-x-2">
                      <div className="flex items-center text-gray-400 dark:text-gray-500">
                        Address
                        <span className="hidden sm:block">:</span>
                      </div>
                      {general && (<div className="flex items-center space-x-1.5 sm:space-x-1 xl:space-x-1.5">
                        {ens_data?.[general.receivingAddress?.toLowerCase()]?.name && (
                          <Img
                            src={`${process.env.NEXT_PUBLIC_ENS_AVATAR_URL}/${ens_data?.[general.receivingAddress.toLowerCase()].name}`}
                            alt=""
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <Link href={`/address/${general.receivingAddress}`}>
                          <a className="text-gray-400 dark:text-gray-200 text-base sm:text-xs xl:text-base font-medium">
                            {ellipseAddress(ens_data?.[general.receivingAddress?.toLowerCase()]?.name, 10) || ellipseAddress(general.receivingAddress?.toLowerCase(), 10)}
                          </a>
                        </Link>
                        <Copy size={18} text={general.receivingAddress} />
                        {general.receivingChain?.explorer?.url && (
                          <a
                            href={`${general.receivingChain.explorer.url}${general.receivingChain.explorer.address_path?.replace('{address}', general.receivingAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-white"
                          >
                            {general.receivingChain.explorer.icon ?
                              <img
                                src={general.receivingChain.explorer.icon}
                                alt=""
                                className="w-5 sm:w-4 xl:w-5 h-5 sm:h-4 xl:h-5 rounded-full opacity-60 hover:opacity-100"
                              />
                              :
                              <TiArrowRight size={20} className="transform -rotate-45" />
                            }
                          </a>
                        )}
                      </div>)}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1 xl:space-x-2">
                      <div className="flex items-center text-gray-400 dark:text-gray-500">
                        Amount Sent
                        <span className="hidden sm:block">:</span>
                      </div>
                      {sender?.normalize_amount && (
                        <div className="max-w-min bg-gray-100 dark:bg-gray-800 rounded text-sm space-x-1 py-1 px-2">
                          <span className="font-semibold">{numberFormat(sender.normalize_amount, '0,0.00000000', true)}</span>
                          <span className="uppercase text-gray-600 dark:text-gray-400">{sender.sendingAsset?.contract_ticker_symbol || sender.receivingAsset?.contract_ticker_symbol}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1 xl:space-x-2">
                      <div className="flex items-center text-gray-400 dark:text-gray-500">
                        Amount Received
                        <span className="hidden sm:block">:</span>
                      </div>
                      {receiver?.normalize_amount && (
                        <div className="max-w-min bg-gray-100 dark:bg-gray-800 rounded text-sm space-x-1 py-1 px-2">
                          <span className="font-semibold">{numberFormat(receiver.normalize_amount, '0,0.00000000', true)}</span>
                          <span className="uppercase text-gray-600 dark:text-gray-400">{receiver.receivingAsset?.contract_ticker_symbol || receiver.sendingAsset?.contract_ticker_symbol}</span>
                        </div>
                      )}
                    </div>
                    {false && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1 xl:space-x-2">
                        <div className="flex items-center text-gray-400 dark:text-gray-500">
                          Fees
                          <span className="hidden sm:block">:</span>
                        </div>
                        {receiver?.value && sender?.value && (
                          <div className="max-w-min bg-gray-100 dark:bg-gray-800 rounded text-sm space-x-1 py-1 px-2">
                            <span className="font-semibold">{currency_symbol}{numberFormat(sender.value - receiver.value, '0,0.00000000', true)}</span>
                            {/*<span className="uppercase text-gray-600 dark:text-gray-400">{receiver.receivingAsset?.contract_ticker_symbol || receiver.sendingAsset?.contract_ticker_symbol}</span>*/}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center space-x-2 mx-auto py-2">
                      {data ?
                        general?.sendingChain && (
                          <img
                            src={general.sendingChain.icon}
                            alt=""
                            className="w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6 rounded-full"
                          />
                        )
                        :
                        <div className="skeleton w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6" style={{ borderRadius: '100%' }} />
                      }
                      <TiArrowRight size={24} className="transform text-gray-400 dark:text-gray-500" />
                      <img
                        src={networks.find(network => network.id === '')?.icon}
                        alt=""
                        className="w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6 rounded-full"
                      />
                      <TiArrowRight size={24} className="transform text-gray-400 dark:text-gray-500" />
                      {data ?
                        general?.receivingChain && (
                          <img
                            src={general.receivingChain.icon}
                            alt=""
                            className="w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6 rounded-full"
                          />
                        )
                        :
                        <div className="skeleton w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6" style={{ borderRadius: '100%' }} />
                      }
                    </div>
                    <div>Are you sure you want to fulfill?</div>
                  </div>}
                  cancelButtonTitle="No"
                  confirmButtonTitle="Yes"
                  onConfirm={() => transfer('fulfill', receiver)}
                />
              )
            }
          }
        }
      }
    }
  }
  else {
    if (transfering) {
      setTransfering(null)
    }

    if (result && receiver?.status !== 'Prepared') {
      setResult(null)
    }

    if (startTransferTime) {
      setStartTransferTime(null)
    }
  }

  const tipsButton = (canCancelSender || canDoAction) && (
    <Modal
      buttonTitle={<MdInfoOutline size={24} className="stroke-current" />}
      buttonClassName="bg-white hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 rounded-full text-gray-400 dark:text-gray-500 p-1 sm:p-1.5"
      title={<div className="text-left text-sm sm:text-lg">Instructions to {canFulfill ? 'fulfill or ' : ''}cancel your transaction</div>}
      body={<div className="space-y-3">
        <div className="flex text-left text-sm sm:text-base space-x-2 my-1">
          <span>1.</span>
          <span>Connect your Metamask with the address and the network of the {canCancelSender ? 'sender' : 'receiver'} side.</span>
        </div>
        <button
          className="bg-gray-100 hover:bg-gray-200 dark:bg-indigo-600 dark:hover:bg-indigo-700 pointer-events-none rounded-2xl font-semibold py-1 sm:py-1.5 px-2 sm:px-3"
          style={{ width: 'max-content' }}
        >
          <div className="flex items-center space-x-2">
            <span>Connect</span>
            <img
              src="/logos/wallets/metamask.png"
              alt=""
              className="w-4 h-4 -mr-1 mb-0.5"
            />
          </div>
        </button>
        <TiArrowRight size={24} className="transform rotate-90 mx-auto" />
        <div className="flex items-center justify-center space-x-1.5 sm:space-x-1 xl:space-x-1.5">
          <Copy
            size={18}
            text={canCancelSender ? sender?.sendingAddress : receiver?.sendingAddress}
            copyTitle={<span className="text-gray-400 dark:text-gray-200 text-base sm:text-xs xl:text-base font-medium">
              {ellipseAddress(ens_data?.[(canCancelSender ? sender?.sendingAddress : receiver?.sendingAddress)?.toLowerCase()]?.name, 10) || ellipseAddress((canCancelSender ? sender?.sendingAddress : receiver?.sendingAddress)?.toLowerCase(), 6)}
            </span>}
          />
          {canCancelSender ?
            sender?.sendingChain?.explorer?.url && (
              <a
                href={`${sender.sendingChain.explorer.url}${sender.sendingChain.explorer.address_path?.replace('{address}', sender.sendingAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-white"
              >
                {sender.sendingChain.explorer.icon ?
                  <img
                    src={sender.sendingChain.explorer.icon}
                    alt=""
                    className="w-5 sm:w-4 xl:w-5 h-5 sm:h-4 xl:h-5 rounded-full opacity-60 hover:opacity-100"
                  />
                  :
                  <TiArrowRight size={20} className="transform -rotate-45" />
                }
              </a>
            )
            :
            receiver?.receivingChain?.explorer?.url && (
              <a
                href={`${receiver.receivingChain.explorer.url}${receiver.receivingChain.explorer.address_path?.replace('{address}', receiver.receivingAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-white"
              >
                {receiver.receivingChain.explorer.icon ?
                  <img
                    src={receiver.receivingChain.explorer.icon}
                    alt=""
                    className="w-5 sm:w-4 xl:w-5 h-5 sm:h-4 xl:h-5 rounded-full opacity-60 hover:opacity-100"
                  />
                  :
                  <TiArrowRight size={20} className="transform -rotate-45" />
                }
              </a>
            )
          }
        </div>
        {canCancelSender ?
          sender?.sendingChain && (
            <div className="flex items-center justify-center space-x-2 mt-1.5">
              {sender.sendingChain.icon && (
                <img
                  src={sender.sendingChain.icon}
                  alt=""
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-gray-700 dark:text-gray-300 text-base font-semibold">{sender.sendingChain.title || sender.sendingChain.short_name}</span>
            </div>
          )
          :
          receiver?.receivingChain && (
            <div className="flex items-center justify-center space-x-2 mt-1.5">
              {receiver.receivingChain.icon && (
                <img
                  src={receiver.receivingChain.icon}
                  alt=""
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-gray-700 dark:text-gray-300 text-base font-semibold">{receiver.receivingChain.title || receiver.receivingChain.short_name}</span>
            </div>
          )
        }
        <div className="flex text-left text-gray-400 dark:text-gray-500 text-xs font-light space-x-2 my-1">
          <span>If the address does not match, the dashboard will show 'Address not match' status. Likewise, if the network does not match, there will be a 'Wrong Network' status. Then you need to switch it to the correct one.</span>
        </div>
        <TiArrowRight size={24} className="transform rotate-90 mx-auto" />
        <div className="flex text-left text-sm sm:text-base space-x-2 mt-2 mb-1">
          <span>2.</span>
          <span>Once connected, the buttons will appear.</span>
        </div>
        <div className="flex text-left text-gray-400 dark:text-gray-500 text-xs font-light space-x-2 my-1">
          {canCancelSender ?
            <span><span className="font-semibold">Cancel Button for Sender:</span> The button can be processed when the sender transaction is prepared and expired.</span>
            :
            <span><span className="font-semibold">Fulfill and Cancel Button for Receiver:</span> The fulfill action can be processed when the receiver transaction is prepared and has not expired yet. While the cancel action does not consider the expiry date, only prepared status is required.</span>
          }
        </div>
        <div className="flex items-center justify-center space-x-1.5 sm:space-x-2">
          <button
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 pointer-events-none rounded-2xl flex items-center font-semibold space-x-1.5 py-1 sm:py-1.5 px-2 sm:px-3"
          >
            <span>Cancel</span>
          </button>
          {canFulfill && (
            <button
              className="bg-green-400 hover:bg-green-500 dark:bg-green-600 dark:hover:bg-green-500 pointer-events-none rounded-2xl flex items-center text-white font-semibold space-x-1.5 py-1 sm:py-1.5 px-2 sm:px-3"
            >
              <span>Fulfill</span>
            </button>
          )}
        </div>
        <div className="flex text-left text-sm sm:text-base space-x-2 mt-2 mb-1">
          <span>3.</span>
          <span>Click the actions you want to proceed with.</span>
        </div>
        <TiArrowRight size={24} className="transform rotate-90 mx-auto" />
        <div className="w-32 sm:w-40 space-y-1 mx-auto">
          <div className="w-full flex items-center justify-center text-blue-500 dark:text-blue-400 space-x-1">
            <span className="font-semibold">{/*canFulfill ? 'Fulfilling' : 'Canceling'*/}Waiting to Sign</span>
            <Loader type="ThreeDots" color={theme === 'dark' ? '#60A5FA' : '#3B82F6'} width="16" height="16" className="mt-1" />
          </div>
          {/*<ProgressBar
            width={100 / 3}
            color="bg-blue-500 dark:bg-blue-400"
            backgroundClassName="bg-gray-50 dark:bg-gray-800"
            className="h-1"
          />*/}
        </div>
        <div className="flex text-left text-sm sm:text-base space-x-2 mt-2 mb-1">
          <span>4.</span>
          <span>Wait for the final result.</span>
        </div>
        <TiArrowRight size={24} className="transform rotate-90 mx-auto" />
        <Alert
          color="bg-blue-500 dark:bg-blue-600 text-left text-white"
          icon={<FaClock className="w-4 h-4 stroke-current mr-2" />}
          closeDisabled={true}
        >
          <span>Wait for Confirmation.</span>
        </Alert>
      </div>}
      confirmButtonTitle="Ok"
    />
  )

  return (
    !data || data.data ?
      <>
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0">
          {result && (
            <Notification
              outerClassNames="w-full h-auto z-50 transform fixed top-0 left-0 p-0"
              innerClassNames={`${result.error ? 'bg-red-500 dark:bg-red-600' : 'bg-blue-500 dark:bg-blue-600'} text-white`}
              animation="animate__animated animate__fadeInDown"
              icon={result.error ?
                <FaTimesCircle className="w-4 h-4 stroke-current mr-2" />
                :
                <FaClock className="w-4 h-4 stroke-current mr-2" />
              }
              content={<span>{result.error?.reason || result.error?.data?.message || result.error?.message || result.message}</span>}
            />
          )}
          <Widget
            title={<div className="uppercase text-gray-600 dark:text-gray-400 text-sm sm:text-base font-semibold mb-2">Asset</div>}
            className="max-wax sm:max-w-min mr-4 px-5 lg:px-3 xl:px-5"
          >
            {data ?
              <>
                <div className="flex flex-row items-center space-x-3 lg:space-x-1.5 xl:space-x-3">
                  {general?.sendingAssetId ?
                    <div className="flex flex-col">
                      {general.sendingAsset && (
                        <a
                          href={`${general.sendingChain?.explorer?.url}${general.sendingChain?.explorer?.[`contract${general.sendingAssetId?.includes('0x0000000000000000000000000000000000000000') ? '_0' : ''}_path`]?.replace('{address}', general.sendingAssetId)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2"
                        >
                          {general.sendingAsset.logo_url && (
                            <Img
                              src={general.sendingAsset.logo_url}
                              alt=""
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span className="h-6 text-base font-semibold">{general.sendingAsset.contract_ticker_symbol || general.sendingAsset.contract_name}</span>
                        </a>
                      )}
                      <div className="min-w-max flex items-center space-x-1">
                        <Copy
                          size={14}
                          text={general.sendingAssetId}
                          copyTitle={<span className="text-gray-400 dark:text-gray-200 text-xs font-medium">
                            {ellipseAddress(general.sendingAssetId, 6)}
                          </span>}
                        />
                        {!general.sendingAsset && general.sendingChain?.explorer?.url && (
                          <a
                            href={`${general.sendingChain.explorer.url}${general.sendingChain.explorer[`contract${general.sendingAssetId?.includes('0x0000000000000000000000000000000000000000') ? '_0' : ''}_path`]?.replace('{address}', general.sendingAssetId)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-white"
                          >
                            {general.sendingChain.explorer.icon ?
                              <img
                                src={general.sendingChain.explorer.icon}
                                alt=""
                                className="w-4 h-4 rounded-full opacity-60 hover:opacity-100"
                              />
                              :
                              <TiArrowRight size={20} className="transform -rotate-45" />
                            }
                          </a>
                        )}
                      </div>
                    </div>
                    :
                    <span className="text-gray-400 dark:text-gray-600 font-light">-</span>
                  }
                  <TiArrowRight size={24} />
                  {general?.receivingAssetId ?
                    <div className="flex flex-col">
                      {general.receivingAsset && (
                        <a
                          href={`${general.receivingChain?.explorer?.url}${general.receivingChain?.explorer?.[`contract${general.receivingAssetId?.includes('0x0000000000000000000000000000000000000000') ? '_0' : ''}_path`]?.replace('{address}', general.receivingAssetId)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2"
                        >
                          {general.receivingAsset.logo_url && (
                            <Img
                              src={general.receivingAsset.logo_url}
                              alt=""
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span className="h-6 text-base font-semibold">{general.receivingAsset.contract_ticker_symbol || general.receivingAsset.contract_name}</span>
                        </a>
                      )}
                      <div className="min-w-max flex items-center space-x-1">
                        <Copy
                          size={14}
                          text={general.receivingAssetId}
                          copyTitle={<span className="text-gray-400 dark:text-gray-200 text-xs font-medium">
                            {ellipseAddress(general.receivingAssetId, 6)}
                          </span>}
                        />
                        {!general.receivingAsset && general.receivingChain?.explorer?.url && (
                          <a
                            href={`${general.receivingChain.explorer.url}${general.receivingChain.explorer[`contract${general.receivingAssetId?.includes('0x0000000000000000000000000000000000000000') ? '_0' : ''}_path`]?.replace('{address}', general.receivingAssetId)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-white"
                          >
                            {general.receivingChain.explorer.icon ?
                              <img
                                src={general.receivingChain.explorer.icon}
                                alt=""
                                className="w-4 h-4 rounded-full opacity-60 hover:opacity-100"
                              />
                              :
                              <TiArrowRight size={20} className="transform -rotate-45" />
                            }
                          </a>
                        )}
                      </div>
                    </div>
                    :
                    <span className="text-gray-400 dark:text-gray-600 font-light">-</span>
                  }
                </div>
                <div className="flex items-center">
                  {sender?.normalize_amount && (
                    <div className="max-w-min bg-gray-100 dark:bg-gray-800 rounded text-sm space-x-1 mt-2 mb-1 py-1 px-2">
                      <span className="font-semibold">{numberFormat(sender.normalize_amount, '0,0.00000000', true)}</span>
                      <span className="uppercase text-gray-600 dark:text-gray-400">{sender.sendingAsset?.contract_ticker_symbol || sender.receivingAsset?.contract_ticker_symbol}</span>
                    </div>
                  )}
                  {receiver?.normalize_amount && (
                    <div className="max-w-min bg-gray-100 dark:bg-gray-800 rounded text-sm space-x-1 mt-2 mb-1 ml-auto py-1 px-2">
                      <span className="font-semibold">{numberFormat(receiver.normalize_amount, '0,0.00000000', true)}</span>
                      <span className="uppercase text-gray-600 dark:text-gray-400">{receiver.receivingAsset?.contract_ticker_symbol || receiver.sendingAsset?.contract_ticker_symbol}</span>
                    </div>
                  )}
                </div>
              </>
              :
              <>
                <div className="skeleton w-72 h-10 mt-1 sm:ml-auto" />
                <div className="skeleton w-24 h-6 mt-3 sm:ml-auto" />
              </>
            }
          </Widget>
          <Widget
            title={<div className="uppercase text-gray-600 dark:text-gray-400 text-sm sm:text-base font-semibold mb-2">Token Transfers</div>}
            right={<div className="flex items-center space-x-0.5 mb-2 lg:mb-0.5 -mr-1 sm:-mr-2">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                {(canCancelSender || canDoAction) && (
                  <Wallet
                    hidden={web3_provider && !mustSwitchNetwork ? true : false}
                    chainIdToConnect={mustSwitchNetwork && (canCancelSender ? sender?.sendingChainId : receiver?.receivingChainId)}
                  />
                )}
                {actionButtons}
              </div>
              {tipsButton}
            </div>}
            className="overflow-x-auto ml-auto px-5 lg:px-3 xl:px-5"
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 my-2">
              {data ?
                general?.sendingAddress ?
                  <div className="min-w-max">
                    <div className="flex items-center space-x-1.5 sm:space-x-1 xl:space-x-1.5">
                      {ens_data?.[general.sendingAddress?.toLowerCase()]?.name && (
                        <Img
                          src={`${process.env.NEXT_PUBLIC_ENS_AVATAR_URL}/${ens_data?.[general.sendingAddress.toLowerCase()].name}`}
                          alt=""
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <Link href={`/address/${general.sendingAddress}`}>
                        <a className="text-gray-400 dark:text-gray-200 text-base sm:text-xs xl:text-base font-medium">
                          {ellipseAddress(ens_data?.[general.sendingAddress?.toLowerCase()]?.name, 10) || ellipseAddress(general.sendingAddress?.toLowerCase(), 6)}
                        </a>
                      </Link>
                      <Copy size={18} text={general.sendingAddress} />
                      {general.sendingChain?.explorer?.url && (
                        <a
                          href={`${general.sendingChain.explorer.url}${general.sendingChain.explorer.address_path?.replace('{address}', general.sendingAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-white"
                        >
                          {general.sendingChain.explorer.icon ?
                            <img
                              src={general.sendingChain.explorer.icon}
                              alt=""
                              className="w-5 sm:w-4 xl:w-5 h-5 sm:h-4 xl:h-5 rounded-full opacity-60 hover:opacity-100"
                            />
                            :
                            <TiArrowRight size={20} className="transform -rotate-45" />
                          }
                        </a>
                      )}
                    </div>
                    {general.sendingChain && (
                      <div className="flex items-center justify-center sm:justify-start space-x-2 mt-1.5">
                        {general.sendingChain.icon && (
                          <img
                            src={general.sendingChain.icon}
                            alt=""
                            className="w-8 sm:w-6 xl:w-8 h-8 sm:h-6 xl:h-8 rounded-full"
                          />
                        )}
                        <span className="text-gray-700 dark:text-gray-300 text-lg sm:text-base xl:text-lg font-semibold">{general.sendingChain.short_name || general.sendingChain.title}</span>
                      </div>
                    )}
                  </div>
                  :
                  <span className="text-gray-400 dark:text-gray-600 font-light">Unknown</span>
                :
                <div>
                  <div className="skeleton w-40 h-6 sm:h-5 xl:h-6 mt-1" />
                  <div className="skeleton w-16 h-8 sm:h-6 xl:h-8 mt-3 mx-auto sm:ml-0" />
                </div>
              }
              <div className="mx-auto">
                <TiArrowRight size={24} className="transform rotate-90 sm:rotate-0 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex flex-col items-center justify-center mx-auto">
                {data ?
                  <>
                    <div className={`max-w-min h-7 bg-gray-100 dark:bg-${sender?.status ? ['Fulfilled'].includes(sender.status) ? 'green-600' : ['Prepared'].includes(sender.status) ? 'yellow-500' : 'red-700' : sender?.chainId && networks.findIndex(_network => !_network.disabled && _network.network_id === sender.chainId) < 0 ? 'gray-700' : 'indigo-500'} rounded-lg flex items-center space-x-1 py-1.5 px-2`}>
                      {sender?.status ?
                        ['Fulfilled'].includes(sender.status) ?
                          <FaCheckCircle size={14} className="text-green-500 dark:text-white" />
                          :
                          ['Prepared'].includes(sender.status) ?
                            result && !result.error && ['sender'].includes(result.side) ?
                              <Loader type="Oval" color={theme === 'dark' ? 'white' : 'gray'} width="16" height="16" className="mr-0.5" />
                              :
                              <MdPending size={14} className="text-yellow-500 dark:text-white" />
                            :
                            <FaTimesCircle size={14} className="text-red-500 dark:text-white" />
                        :
                        sender?.chainId && networks.findIndex(_network => !_network.disabled && _network.network_id === sender.chainId) < 0 ?
                          <FaQuestion size={14} className="text-gray-300 dark:text-white" />
                          :
                          <FaClock size={14} className="text-gray-300 dark:text-white" />
                      }
                      <div className={`uppercase ${sender?.status ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white'} text-xs font-semibold`}>{sender?.status || (sender?.chainId && networks.findIndex(_network => !_network.disabled && _network.network_id === sender.chainId) < 0 ? 'Unknown' : 'Preparing')}</div>
                    </div>
                    {sender?.chainTx && sender?.sendingChain?.explorer?.url && (
                      <div className="flex items-center space-x-1 mt-0.5">
                        <Copy
                          size={12}
                          text={sender.chainTx}
                          copyTitle={<span className="text-gray-500 dark:text-gray-400 text-xs font-normal">
                            {ellipseAddress(sender.chainTx, 6)}
                          </span>}
                        />
                        <a
                          href={`${sender.sendingChain.explorer.url}${sender.sendingChain.explorer.transaction_path?.replace('{tx}', sender.chainTx)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-white"
                        >
                          {sender.sendingChain?.explorer?.icon ?
                            <img
                              src={sender.sendingChain.explorer.icon}
                              alt=""
                              className="w-4 sm:w-3 xl:w-4 h-4 sm:h-3 xl:h-4 rounded-full opacity-60 hover:opacity-100"
                            />
                            :
                            <TiArrowRight size={16} className="transform -rotate-45" />
                          }
                        </a>
                      </div>
                    )}
                    {sender?.preparedTimestamp && (
                      <div className={`text-gray-400 dark:text-gray-500 text-2xs font-light mt-${1 + (sender?.chainTx ? 0 : 0.5)}`}>
                        {moment(sender.preparedTimestamp).format('MMM D, YYYY h:mm:ss A')}
                      </div>
                    )}
                  </>
                  :
                  <>
                    <div className="skeleton w-24 h-7 mt-0.5" />
                    <div className="skeleton w-28 h-4 mt-1.5" />
                    <div className="skeleton w-28 h-3.5 mt-1.5" />
                  </>
                }
              </div>
              <div className="mx-auto">
                <TiArrowRight size={24} className="transform rotate-90 sm:rotate-0 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="mx-auto">
                <div className="min-w-max grid grid-flow-row grid-cols-3 gap-2 sm:mt-1 xl:mt-0">
                  {data ?
                    general?.sendingChain && (
                      <img
                        src={general.sendingChain.icon}
                        alt=""
                        className="w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6 rounded-full mx-auto"
                      />
                    )
                    :
                    <div className="skeleton w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6 mx-auto" style={{ borderRadius: '100%' }} />
                  }
                  <img
                    src={networks.find(network => network.id === '')?.icon}
                    alt=""
                    className="w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6 rounded-full mx-auto"
                  />
                  {data ?
                    general?.receivingChain && (
                      <img
                        src={general.receivingChain.icon}
                        alt=""
                        className="w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6 rounded-full mx-auto"
                      />
                    )
                    :
                    <div className="skeleton w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6 mx-auto" style={{ borderRadius: '100%' }} />
                  }
                </div>
                {general?.router?.id && (
                  ens_data?.[general.router.id.toLowerCase()]?.name ?
                    <>
                      <div className="flex items-center justify-start sm:justify-center text-gray-400 dark:text-gray-500 text-xs font-medium space-x-1 mt-1.5">
                        <MdOutlineRouter size={16} className="mb-0.5" />
                        <Link href={`/router/${general.router.id}`}>
                          <a className="text-gray-900 dark:text-white font-semibold">
                            {ens_data[general.router.id.toLowerCase()].name}
                          </a>
                        </Link>
                      </div>
                      <div className="flex justify-start sm:justify-center">
                        <Copy
                          text={general.router.id}
                          copyTitle={<span className="text-gray-400 dark:text-gray-500 text-xs font-normal">
                            {ellipseAddress(general.router.id, 6)}
                          </span>}
                        />
                      </div>
                    </>
                    :
                    <>
                      <div className="flex items-center font-medium space-x-1 mt-2">
                        <Link href={`/router/${general.router.id}`}>
                          <a className="text-indigo-600 dark:text-white text-xs font-medium">
                            {ellipseAddress(general.router.id, 6)}
                          </a>
                        </Link>
                        <Copy size={12} text={general.router.id} />
                      </div>
                      <div className="flex items-center justify-start sm:justify-center text-gray-400 dark:text-gray-500 text-xs font-medium space-x-1 mt-0.5">
                        <MdOutlineRouter size={16} className="mb-0.5" />
                        <span>Router</span>
                      </div>
                    </>
                )}
              </div>
              <div className="mx-auto">
                <TiArrowRight size={24} className="transform rotate-90 sm:rotate-0 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex flex-col items-center justify-center mx-auto">
                {data ?
                  <>
                    <div className={`min-w-max max-w-min h-7 bg-gray-100 dark:bg-${receiver?.status ? ['Fulfilled'].includes(receiver.status) ? 'green-600' : ['Prepared'].includes(receiver.status) ? 'yellow-500' : 'red-700' : sender?.status === 'Cancelled' ? 'red-700' : receiver?.chainId && networks.findIndex(_network => !_network.disabled && _network.network_id === receiver.chainId) < 0 ? 'gray-700' : 'indigo-500'} rounded-lg flex items-center space-x-1 py-1.5 px-2`}>
                      {receiver?.status ?
                        ['Fulfilled'].includes(receiver.status) ?
                          <FaCheckCircle size={14} className="text-green-500 dark:text-white" />
                          :
                          ['Prepared'].includes(receiver.status) ?
                            result && !result.error && !['sender'].includes(result.side) ?
                              <Loader type="Oval" color={theme === 'dark' ? 'white' : 'gray'} width="16" height="16" className="mr-0.5" />
                              :
                              <MdPending size={14} className="text-yellow-500 dark:text-white" />
                            :
                            <FaTimesCircle size={14} className="text-red-500 dark:text-white" />
                        :
                        sender?.status === 'Cancelled' ?
                          <FaTimesCircle size={14} className="text-red-500 dark:text-white" />
                          :
                          receiver?.chainId && networks.findIndex(_network => !_network.disabled && _network.network_id === receiver.chainId) < 0 ?
                            <FaQuestion size={14} className="text-gray-300 dark:text-white" />
                            :
                            <FaClock size={14} className="text-gray-300 dark:text-white" />
                      }
                      <div className={`uppercase ${receiver?.status ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white'} text-xs font-semibold`}>{receiver?.status ? receiver.status : sender?.status === 'Cancelled' ? 'Ignored' : receiver?.chainId && networks.findIndex(_network => !_network.disabled && _network.network_id === receiver.chainId) < 0 ? 'Unknown' : 'Pending'}</div>
                    </div>
                    {receiver?.chainTx && receiver?.receivingChain?.explorer?.url && (
                      <div className="flex items-center space-x-1 mt-0.5">
                        <Copy
                          size={12}
                          text={receiver.chainTx}
                          copyTitle={<span className="text-gray-500 dark:text-gray-400 text-xs font-normal">
                            {ellipseAddress(receiver.chainTx, 6)}
                          </span>}
                        />
                        <a
                          href={`${receiver.receivingChain.explorer.url}${receiver.receivingChain.explorer.transaction_path?.replace('{tx}', receiver.chainTx)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-white"
                        >
                          {receiver.receivingChain?.explorer?.icon ?
                            <img
                              src={receiver.receivingChain.explorer.icon}
                              alt=""
                              className="w-4 sm:w-3 xl:w-4 h-4 sm:h-3 xl:h-4 rounded-full opacity-60 hover:opacity-100"
                            />
                            :
                            <TiArrowRight size={16} className="transform -rotate-45" />
                          }
                        </a>
                      </div>
                    )}
                    {receiver?.preparedTimestamp && (
                      <div className={`text-gray-400 dark:text-gray-500 text-2xs font-light mt-${1 + (receiver?.chainTx ? 0 : 0.5)}`}>
                        {moment(receiver.preparedTimestamp).format('MMM D, YYYY h:mm:ss A')}
                      </div>
                    )}
                  </>
                  :
                  <>
                    <div className="skeleton w-24 h-7 mt-0.5" />
                    <div className="skeleton w-28 h-4 mt-1.5" />
                    <div className="skeleton w-28 h-3.5 mt-1.5" />
                  </>
                }
              </div>
              <div className="mx-auto">
                <TiArrowRight size={24} className="transform rotate-90 sm:rotate-0 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="hidden sm:block sm:ml-auto" />
              {data ?
                general?.receivingAddress ?
                  <div className="min-w-max">
                    <div className="flex items-center space-x-1.5 sm:space-x-1 xl:space-x-1.5">
                      {ens_data?.[general.receivingAddress?.toLowerCase()]?.name && (
                        <Img
                          src={`${process.env.NEXT_PUBLIC_ENS_AVATAR_URL}/${ens_data?.[general.receivingAddress.toLowerCase()].name}`}
                          alt=""
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <Link href={`/address/${general.receivingAddress}`}>
                        <a className="text-gray-400 dark:text-gray-200 text-base sm:text-xs xl:text-base font-medium">
                          {ellipseAddress(ens_data?.[general.receivingAddress?.toLowerCase()]?.name, 10) || ellipseAddress(general.receivingAddress?.toLowerCase(), 6)}
                        </a>
                      </Link>
                      <Copy size={18} text={general.receivingAddress} />
                      {general.receivingChain?.explorer?.url && (
                        <a
                          href={`${general.receivingChain.explorer.url}${general.receivingChain.explorer.address_path?.replace('{address}', general.receivingAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-white"
                        >
                          {general.receivingChain.explorer.icon ?
                            <img
                              src={general.receivingChain.explorer.icon}
                              alt=""
                              className="w-5 sm:w-4 xl:w-5 h-5 sm:h-4 xl:h-5 rounded-full opacity-60 hover:opacity-100"
                            />
                            :
                            <TiArrowRight size={20} className="transform -rotate-45" />
                          }
                        </a>
                      )}
                    </div>
                    {general.receivingChain && (
                      <div className="flex items-center justify-center sm:justify-end space-x-2 mt-1.5">
                        {general.receivingChain.icon && (
                          <img
                            src={general.receivingChain.icon}
                            alt=""
                            className="w-8 sm:w-6 xl:w-8 h-8 sm:h-6 xl:h-8 rounded-full"
                          />
                        )}
                        <span className="text-gray-700 dark:text-gray-300 text-lg sm:text-base xl:text-lg font-semibold">{general.receivingChain.short_name || general.receivingChain.title}</span>
                      </div>
                    )}
                  </div>
                  :
                  <span className="text-gray-400 dark:text-gray-600 font-light">Unknown</span>
                :
                <div>
                  <div className="skeleton w-40 h-6 sm:h-5 xl:h-6 mt-1" />
                  <div className="skeleton w-16 h-8 sm:h-6 xl:h-8 mt-3 mx-auto sm:mr-0" />
                </div>
              }
            </div>
          </Widget>
        </div>
        <div className="grid grid-flow-row grid-cols-1 sm:grid-cols-2 gap-4 mt-4 lg:mt-8">
          {[sender, receiver].map((transaction, i) => (
            <Widget
              key={i}
              title={<div className="flex items-center space-x-2 mb-4">
                {transaction?.[i === 0 ? 'sendingChain' : 'receivingChain']?.icon && (
                  <img
                    src={transaction.[i === 0 ? 'sendingChain' : 'receivingChain'].icon}
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="uppercase text-gray-600 dark:text-gray-400 text-sm font-semibold">Transaction Details</span>
              </div>}
              className="p-5 lg:px-3 xl:px-5"
            >
              <div className="w-full flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 space-x-0 md:space-x-2">
                  <span className="md:w-20 xl:w-40 whitespace-nowrap text-xs lg:text-base font-semibold">Prepare TX:</span>
                  {data ?
                    transaction?.prepareTransactionHash ?
                      <div className="flex items-center">
                        {transaction.[i === 0 ? 'sendingChain' : 'receivingChain']?.explorer?.url ?
                          <a
                            href={`${transaction.[i === 0 ? 'sendingChain' : 'receivingChain'].explorer.url}${transaction.[i === 0 ? 'sendingChain' : 'receivingChain'].explorer.transaction_path?.replace('{tx}', transaction.prepareTransactionHash)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="uppercase text-indigo-600 dark:text-white text-xs lg:text-base font-medium mr-1"
                          >
                            {ellipseAddress(transaction.prepareTransactionHash, 16)}
                          </a>
                          :
                          <span className="text-xs lg:text-base mr-1">{ellipseAddress(transaction.prepareTransactionHash, 16)}</span>
                        }
                        <Copy size={18} text={transaction.prepareTransactionHash} />
                      </div>
                      :
                      <span className="text-xs lg:text-base">-</span>
                    :
                    <div className="skeleton w-72 h-4 lg:h-6 mt-1" />
                  }
                </div>
                <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 space-x-0 md:space-x-2">
                  <span className="md:w-20 xl:w-40 text-xs lg:text-base font-semibold">{transaction?.cancelTransactionHash ? 'Cancel' : 'Fulfill'} TX:</span>
                  {data ?
                    transaction?.fulfillTransactionHash || transaction?.cancelTransactionHash ?
                      <div className="flex items-center">
                        {transaction.[i === 0 ? 'sendingChain' : 'receivingChain']?.explorer?.url ?
                          <a
                            href={`${transaction.[i === 0 ? 'sendingChain' : 'receivingChain'].explorer.url}${transaction.[i === 0 ? 'sendingChain' : 'receivingChain'].explorer.transaction_path?.replace('{tx}', transaction?.fulfillTransactionHash || transaction?.cancelTransactionHash)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="uppercase text-indigo-600 dark:text-white text-xs lg:text-base font-medium mr-1"
                          >
                            {ellipseAddress(transaction?.fulfillTransactionHash || transaction?.cancelTransactionHash, 16)}
                          </a>
                          :
                          <span className="text-xs lg:text-base mr-1">{ellipseAddress(transaction?.fulfillTransactionHash || transaction?.cancelTransactionHash, 16)}</span>
                        }
                        <Copy size={18} text={transaction?.fulfillTransactionHash || transaction?.cancelTransactionHash} />
                      </div>
                      :
                      <span className="text-xs lg:text-base">-</span>
                    :
                    <div className="skeleton w-72 h-4 lg:h-6 mt-1" />
                  }
                </div>
                <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 space-x-0 md:space-x-2">
                  <span className="md:w-20 xl:w-40 text-xs lg:text-base font-semibold">Block:</span>
                  {data ?
                    transaction?.preparedBlockNumber ?
                      transaction.[i === 0 ? 'sendingChain' : 'receivingChain']?.explorer?.url ?
                        <a
                          href={`${transaction.[i === 0 ? 'sendingChain' : 'receivingChain'].explorer.url}${transaction.[i === 0 ? 'sendingChain' : 'receivingChain'].explorer.block_path?.replace('{block}', transaction.preparedBlockNumber)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs lg:text-base"
                        >
                          {numberFormat(transaction.preparedBlockNumber, '0,0')}
                        </a>
                        :
                        <span className="text-xs lg:text-base">{numberFormat(transaction.preparedBlockNumber, '0,0')}</span>
                      :
                      <span className="text-xs lg:text-base">-</span>
                    :
                    <div className="skeleton w-24 h-4 lg:h-6 mt-1" />
                  }
                </div>
                <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 space-x-0 md:space-x-2">
                  <span className="md:w-20 xl:w-40 text-xs lg:text-base font-semibold">Status:</span>
                  {data ?
                    i === 0 ?
                      <div className={`max-w-min h-7 bg-gray-100 dark:bg-${transaction?.status ? ['Fulfilled'].includes(transaction.status) ? 'green-600' : ['Prepared'].includes(transaction.status) ? 'yellow-500' : 'red-700' : transaction?.chainId && networks.findIndex(_network => !_network.disabled && _network.network_id === transaction.chainId) < 0 ? 'gray-700' : 'indigo-500'} rounded-lg flex items-center space-x-1 py-1.5 px-2`}>
                        {transaction?.status ?
                          ['Fulfilled'].includes(transaction.status) ?
                            <FaCheckCircle size={14} className="text-green-500 dark:text-white" />
                            :
                            ['Prepared'].includes(transaction.status) ?
                              result && !result.error && ['sender'].includes(result.side) ?
                                <Loader type="Oval" color={theme === 'dark' ? 'white' : 'gray'} width="16" height="16" className="mr-0.5" />
                                :
                                <MdPending size={14} className="text-yellow-500 dark:text-white" />
                              :
                              <FaTimesCircle size={14} className="text-red-500 dark:text-white" />
                          :
                          transaction?.chainId && networks.findIndex(_network => !_network.disabled && _network.network_id === transaction.chainId) < 0 ?
                            <FaQuestion size={14} className="text-gray-300 dark:text-white" />
                            :
                            <FaClock size={14} className="text-gray-300 dark:text-white" />
                        }
                        <div className={`uppercase ${transaction?.status ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white'} text-xs font-semibold`}>{transaction?.status || (transaction?.chainId && networks.findIndex(_network => !_network.disabled && _network.network_id === transaction.chainId) < 0 ? 'Unknown' : 'Preparing')}</div>
                      </div>
                      :
                      <div className={`max-w-min h-7 bg-gray-100 dark:bg-${transaction?.status ? ['Fulfilled'].includes(transaction.status) ? 'green-600' : ['Prepared'].includes(transaction.status) ? 'yellow-500' : 'red-700' : sender?.status === 'Cancelled' ? 'red-700' : transaction?.chainId && networks.findIndex(_network => !_network.disabled && _network.network_id === transaction.chainId) < 0 ? 'gray-700' : 'indigo-500'} rounded-lg flex items-center space-x-1 py-1.5 px-2`}>
                        {transaction?.status ?
                          ['Fulfilled'].includes(transaction.status) ?
                            <FaCheckCircle size={14} className="text-green-500 dark:text-white" />
                            :
                            ['Prepared'].includes(transaction.status) ?
                              result && !result.error && !['sender'].includes(result.side) ?
                                <Loader type="Oval" color={theme === 'dark' ? 'white' : 'gray'} width="16" height="16" className="mr-0.5" />
                                :
                                <MdPending size={14} className="text-yellow-500 dark:text-white" />
                              :
                              <FaTimesCircle size={14} className="text-red-500 dark:text-white" />
                          :
                          sender?.status === 'Cancelled' ?
                            <FaTimesCircle size={14} className="text-red-500 dark:text-white" />
                            :
                            transaction?.chainId && networks.findIndex(_network => !_network.disabled && _network.network_id === transaction.chainId) < 0 ?
                              <FaQuestion size={14} className="text-gray-300 dark:text-white" />
                              :
                              <FaClock size={14} className="text-gray-300 dark:text-white" />
                        }
                        <div className={`uppercase ${transaction?.status ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white'} text-xs font-semibold`}>{transaction?.status ? transaction.status : sender?.status === 'Cancelled' ? 'Ignored' : transaction?.chainId && networks.findIndex(_network => !_network.disabled && _network.network_id === transaction.chainId) < 0 ? 'Unknown' : 'Pending'}</div>
                      </div>
                    :
                    <div className="skeleton w-24 h-5 lg:h-7 mt-1" />
                  }
                </div>
                <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 space-x-0 md:space-x-2">
                  <span className="md:w-20 xl:w-40 text-xs lg:text-base font-semibold">Time:</span>
                  {data ?
                    transaction?.preparedTimestamp ?
                      <span className="text-xs lg:text-base">
                        <span className="text-gray-400 dark:text-gray-500 mr-1">{moment(transaction.preparedTimestamp).fromNow()}</span>
                        <span>({moment(transaction.preparedTimestamp).format('MMM D, YYYY h:mm:ss A')})</span>
                      </span>
                      :
                      <span className="text-xs lg:text-base">-</span>
                    :
                    <div className="skeleton w-60 h-4 lg:h-6 mt-1" />
                  }
                </div>
                <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 space-x-0 md:space-x-2">
                  <span className="md:w-20 xl:w-40 text-xs lg:text-base font-semibold">Expiry:</span>
                  {data ?
                    transaction?.expiry ?
                      <span className="text-xs lg:text-base">
                        <span className="text-gray-400 dark:text-gray-500 mr-1">{moment(transaction.expiry).fromNow()}</span>
                        <span>({moment(transaction.expiry).format('MMM D, YYYY h:mm:ss A')})</span>
                      </span>
                      :
                      <span className="text-xs lg:text-base">-</span>
                    :
                    <div className="skeleton w-60 h-4 lg:h-6 mt-1" />
                  }
                </div>
              </div>
            </Widget>
          ))}
        </div>
        <div className="mt-4 lg:mt-8">
          <Widget className="p-5 lg:px-3 xl:px-5">
            <div className="grid grid-flow-row grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex flex-col space-y-2">
                <span className="text-xs lg:text-base font-semibold">Bid Signature:</span>
                {data ?
                  general?.bidSignature ?
                    <div className="flex items-start">
                      <span className="break-all text-gray-400 dark:text-gray-600 text-xs lg:text-base mr-1">{general.bidSignature}</span>
                      <Copy size={20} text={general.bidSignature} />
                    </div>
                    :
                    <span className="text-xs lg:text-base">-</span>
                  :
                  <div className="skeleton w-full sm:w-96 h-4 lg:h-6 mt-1" />
                }
              </div>
              <div className="flex flex-col space-y-2">
                <span className="text-xs lg:text-base font-semibold">Signature:</span>
                {data ?
                  general?.signature ?
                    <div className="flex items-start">
                      <span className="break-all text-gray-400 dark:text-gray-600 text-xs lg:text-base mr-1">{general.signature}</span>
                      <Copy size={20} text={general.signature} />
                    </div>
                    :
                    <span className="text-xs lg:text-base">-</span>
                  :
                  <div className="skeleton w-full sm:w-96 h-4 lg:h-6 mt-1" />
                }
              </div>
            </div>
            <div className="flex flex-col space-y-2 mt-4">
              <div className="flex items-center">
                <span className="text-xs lg:text-base font-semibold">Encoded Bid:</span>
                <div className={`space-x-2 ml-auto mr-${data ? 8 : 0}`}>
                  <Switch
                    checked={decoded}
                    onChange={() => setDecoded(!decoded)}
                    onColor="#10B981"
                    onHandleColor="#A7F3D0"
                    offColor="#E5E7EB"
                    offHandleColor="#F9FAFB"
                    handleDiameter={24}
                    uncheckedIcon={false}
                    checkedIcon={false}
                    boxShadow="0px 1px 5px rgba(0, 0, 0, 0.2)"
                    activeBoxShadow="0px 1px 5px rgba(0, 0, 0, 0.2)"
                    height={20}
                    width={48}
                    className="react-switch"
                  />
                  <span className={`${decoded ? 'text-green-500 dark:text-green-500' : ''} font-medium`}>Decode{decoded ? 'd' : ''}</span>
                </div>
              </div>
              {data ?
                general?.encodedBid ?
                  <div className="flex items-start">
                    <div className="w-full bg-gray-100 dark:bg-gray-800 break-all rounded-xl text-gray-400 dark:text-gray-600 text-xs lg:text-base mr-2 p-4">
                      {decoded ?
                        convertToJson(decodeAuctionBid(general.encodedBid)) ?
                          decodedBid
                          :
                          decodeAuctionBid(general.encodedBid)
                        :
                        general.encodedBid
                      }
                    </div>
                    <Copy size={20} text={decoded ? JSON.stringify(convertToJson(decodeAuctionBid(general.encodedBid))) : general.encodedBid} className="mt-4" />
                  </div>
                  :
                  <span className="text-xs lg:text-base">-</span>
                :
                <div className="flex flex-col space-y-3">
                  {[...Array(8).keys()].map(i => (
                    <div key={i} className="skeleton w-full h-4 lg:h-6" />
                  ))}
                </div>
              }
            </div>
          </Widget>
        </div>
      </>
      :
      <div className="h-96 bg-transparent border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-700 text-gray-300 dark:text-gray-700 flex items-center justify-center text-lg font-medium italic space-x-1.5 mt-4">
        <BsFileEarmarkX size={32} />
        <span>Transaction not found</span>
      </div>
  )
}