import { useRouter } from 'next/router'

import moment from 'moment'
import { Img } from 'react-image'
import { TiArrowRight } from 'react-icons/ti'
import { FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa'

import Copy from '../../copy'
import Widget from '../../widget'

import { networks } from '../../../lib/menus'
import { currency_symbol } from '../../../lib/object/currency'
import { numberFormat, ellipseAddress } from '../../../lib/utils'

export default function Transaction({ data, className = '' }) {
  const router = useRouter()
  const { query } = { ...router }
  const { tx } = { ...query }

  const { sender, receiver } = { ...data?.data }
  const general = receiver || sender
console.log(data)
  return (
    <>
      <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0">
        <Widget
          title={<div className="uppercase text-gray-600 dark:text-gray-400 text-base font-semibold mb-2">Asset</div>}
          className="max-wax sm:max-w-min mr-4 px-5"
        >
          {data ?
            <>
              <div className="flex flex-row items-center space-x-3 lg:space-x-1.5 xl:space-x-3">
                {general?.sendingAssetId ?
                  <div className="flex flex-col">
                    {general.sendingAsset && (
                      <a
                        href={`${general.sendingChain?.explorer?.url}${general.sendingChain?.explorer?.contract_path?.replace('{address}', general.sendingAssetId)}`}
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
                          href={`${general.sendingChain.explorer.url}${general.sendingChain.explorer.contract_path?.replace('{address}', general.sendingAssetId)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-white"
                        >
                          {general.sendingChain.explorer.icon ?
                            <img
                              src={general.sendingChain.explorer.icon}
                              alt=""
                              className="w-4 h-4 rounded-full"
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
                        href={`${general.receivingChain?.explorer?.url}${general.receivingChain?.explorer?.contract_path?.replace('{address}', general.receivingAssetId)}`}
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
                          href={`${general.receivingChain.explorer.url}${general.receivingChain.explorer.contract_path?.replace('{address}', general.receivingAssetId)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-white"
                        >
                          {general.receivingChain.explorer.icon ?
                            <img
                              src={general.receivingChain.explorer.icon}
                              alt=""
                              className="w-4 h-4 rounded-full"
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
              {general?.normalize_amount && (
                <div className="max-w-min bg-gray-100 dark:bg-gray-800 rounded text-sm space-x-1 mt-2 mb-1 ml-auto py-1 px-2">
                  <span className="font-semibold">{numberFormat(general.normalize_amount, '0,0.00000000')}</span>
                  <span className="uppercase text-gray-600 dark:text-gray-400">{general.sendingAsset?.contract_ticker_symbol || general.receivingAsset?.contract_ticker_symbol}</span>
                </div>
              )}
            </>
            :
            <>
              <div className="skeleton w-72 h-10 mt-1 ml-auto" />
              <div className="skeleton w-24 h-6 mt-3 ml-auto" />
            </>
          }
        </Widget>
        <Widget
          title={<div className="uppercase text-gray-600 dark:text-gray-400 text-base font-semibold mb-2">Token Transfers</div>}
          className="ml-auto px-5"
        >
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 mt-0 lg:mt-2">
            {data ?
              general?.sendingAddress ?
                <div className="min-w-max">
                  <div className="flex items-center space-x-1.5 sm:space-x-1 xl:space-x-1.5">
                    <Copy
                      size={18}
                      text={general.sendingAddress}
                      copyTitle={<span className="text-gray-400 dark:text-gray-200 text-base sm:text-xs xl:text-base font-medium">
                        {ellipseAddress(general.sendingAddress, 6)}
                      </span>}
                    />
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
                            className="w-5 sm:w-4 xl:w-5 h-5 sm:h-4 xl:h-5 rounded-full"
                          />
                          :
                          <TiArrowRight size={20} className="transform -rotate-45" />
                        }
                      </a>
                    )}
                  </div>
                  {general.sendingChain && (
                    <div className="flex items-center space-x-2 mt-1.5">
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
                <div className="skeleton w-16 h-8 sm:h-6 xl:h-8 mt-3" />
              </div>
            }
            <div className="ml-0 sm:mx-auto">
              <TiArrowRight size={24} className="transform rotate-90 sm:rotate-0 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="ml-0 sm:mx-auto">
              {data ?
                <>
                  <div className={`max-w-min h-7 bg-gray-100 dark:bg-${sender ? sender.status === 'Fulfilled' ? 'green-600' : sender.status === 'Prepared' ? 'indigo-500' : 'red-700' : 'gray-700'} rounded-lg flex items-center space-x-1 py-1.5 px-2`}>
                    {sender ?
                      sender.status === 'Fulfilled' ?
                        <FaCheckCircle size={14} className="text-green-500 dark:text-white" />
                        :
                        sender.status === 'Prepared' ?
                          <FaClock size={14} className="text-gray-300 dark:text-white" />
                          :
                          <FaTimesCircle size={14} className="text-red-500 dark:text-white" />
                      :
                      <FaClock size={14} className="text-gray-300 dark:text-gray-500" />
                    }
                    <div className={`uppercase ${sender ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'} text-xs font-semibold`}>{sender?.status || 'Preparing'}</div>
                  </div>
                  {sender?.chainTx && sender?.sendingChain?.explorer?.url && (
                    <div className="flex items-center space-x-1 mt-0.5">
                      <Copy
                        size={12}
                        text={sender.chainTx}
                        copyTitle={<span className="text-gray-500 dark:text-gray-400 text-xs font-light">
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
                            className="w-4 sm:w-3 xl:w-4 h-4 sm:h-3 xl:h-4 rounded-full"
                          />
                          :
                          <TiArrowRight size={16} className="transform -rotate-45" />
                        }
                      </a>
                    </div>
                  )}
                  {sender?.preparedTimestamp && (
                    <div className="text-gray-400 dark:text-gray-500 font-light mt-1" style={{ fontSize: '.65rem' }}>
                      {moment(sender.preparedTimestamp).format('MMM D, YYYY h:mm:ss A')}
                    </div>
                  )}
                </>
                :
                <>
                  <div className="skeleton w-20 h-6 mt-0.5" />
                  <div className="skeleton w-28 h-4 mt-1.5" />
                  <div className="skeleton w-24 h-3 mt-3" />
                </>
              }
            </div>
            <div className="ml-0 sm:mx-auto">
              <TiArrowRight size={24} className="transform rotate-90 sm:rotate-0 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="ml-0 sm:mx-auto">
              <div className="min-w-max grid grid-flow-row grid-cols-8 sm:grid-cols-3 gap-2 sm:mt-1 xl:mt-0">
                {data ?
                  general?.sendingChain && (
                    <Img
                      src={general.sendingChain.icon}
                      alt=""
                      className="w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6 rounded-full"
                    />
                  )
                  :
                  <div className="skeleton w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6" style={{ borderRadius: '100%' }} />
                }
                <Img
                  src={networks.find(network => network.id === '')?.icon}
                  alt=""
                  className="w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6 rounded-full"
                />
                {data ?
                  general?.receivingChain && (
                    <Img
                      src={general.receivingChain.icon}
                      alt=""
                      className="w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6 rounded-full"
                    />
                  )
                  :
                  <div className="skeleton w-6 sm:w-4 xl:w-6 h-6 sm:h-4 xl:h-6" style={{ borderRadius: '100%' }} />
                }
              </div>
            </div>
            <div className="ml-0 sm:mx-auto">
              <TiArrowRight size={24} className="transform rotate-90 sm:rotate-0 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="ml-0 sm:mx-auto">
              {data ?
                <>
                  <div className={`max-w-min h-7 bg-gray-100 dark:bg-${receiver ? receiver.status === 'Fulfilled' ? 'green-600' : receiver.status === 'Prepared' ? 'indigo-500' : 'red-700' : 'gray-700'} rounded-lg flex items-center space-x-1 py-1.5 px-2`}>
                    {receiver ?
                      receiver.status === 'Fulfilled' ?
                        <FaCheckCircle size={14} className="text-green-500 dark:text-white" />
                        :
                        receiver.status === 'Prepared' ?
                          <FaClock size={14} className="text-gray-300 dark:text-white" />
                          :
                          <FaTimesCircle size={14} className="text-red-500 dark:text-white" />
                      :
                      sender?.status === 'Cancelled' ?
                        <FaTimesCircle size={14} className="text-gray-300 dark:text-gray-500" />
                        :
                        <FaClock size={14} className="text-gray-300 dark:text-gray-500" />
                    }
                    <div className={`uppercase ${receiver ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'} text-xs font-semibold`}>{receiver?.status || (sender?.status === 'Cancelled' ? 'Ignored' : 'Waiting')}</div>
                  </div>
                  {receiver?.chainTx && receiver?.receivingChain?.explorer?.url && (
                    <div className="flex items-center space-x-1 mt-0.5">
                      <Copy
                        size={12}
                        text={receiver.chainTx}
                        copyTitle={<span className="text-gray-500 dark:text-gray-400 text-xs font-light">
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
                            className="w-4 sm:w-3 xl:w-4 h-4 sm:h-3 xl:h-4 rounded-full"
                          />
                          :
                          <TiArrowRight size={16} className="transform -rotate-45" />
                        }
                      </a>
                    </div>
                  )}
                  {receiver?.preparedTimestamp && (
                    <div className="text-gray-400 dark:text-gray-500 font-light mt-1" style={{ fontSize: '.65rem' }}>
                      {moment(receiver.preparedTimestamp).format('MMM D, YYYY h:mm:ss A')}
                    </div>
                  )}
                </>
                :
                <>
                  <div className="skeleton w-20 h-6 mt-0.5" />
                  <div className="skeleton w-28 h-4 mt-1.5" />
                  <div className="skeleton w-24 h-3 mt-3" />
                </>
              }
            </div>
            <div className="ml-0 sm:mx-auto">
              <TiArrowRight size={24} className="transform rotate-90 sm:rotate-0 text-gray-600 dark:text-gray-400" />
            </div>
            <span className="hidden sm:block sm:ml-auto" />
            {data ?
              general?.receivingAddress ?
                <div className="min-w-max">
                  <div className="flex items-center space-x-1.5 sm:space-x-1 xl:space-x-1.5">
                    <Copy
                      size={18}
                      text={general.receivingAddress}
                      copyTitle={<span className="text-gray-400 dark:text-gray-200 text-base sm:text-xs xl:text-base font-medium">
                        {ellipseAddress(general.receivingAddress, 6)}
                      </span>}
                    />
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
                            className="w-5 sm:w-4 xl:w-5 h-5 sm:h-4 xl:h-5 rounded-full"
                          />
                          :
                          <TiArrowRight size={20} className="transform -rotate-45" />
                        }
                      </a>
                    )}
                  </div>
                  {general.receivingChain && (
                    <div className="flex items-center space-x-2 mt-1.5">
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
                <div className="skeleton w-16 h-8 sm:h-6 xl:h-8 mt-3" />
              </div>
            }
          </div>
        </Widget>
      </div>
      
    </>
  )
}