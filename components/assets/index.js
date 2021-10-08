import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { Img } from 'react-image'
import { MdOutlineRouter } from 'react-icons/md'
import { TiArrowRight } from 'react-icons/ti'

import Copy from '../copy'

import { networks } from '../../lib/menus'
import { numberFormat, ellipseAddress } from '../../lib/utils'

export default function Assets({ data, className = '' }) {
  const router = useRouter()
  const { pathname, query } = { ...router }
  const { chain_id } = { ...query }
  const network = networks[networks.findIndex(network => network.id === chain_id)] || (pathname.startsWith('/[chain_id]') ? null : networks[0])

  return (
    <>
      <div className={`space-y-8 ${className}`}>
        {(data?.chain_id === chain_id ?
          (data?.data || []).map((router, i) => { return { ...router, i } })
          :
          [...Array(1).keys()].map(i => { return { i, skeleton: true } })
        ).map((router, i) => (
          <div key={i} className="space-y-4">
            {!router.skeleton ?
              <div className="flex items-center space-x-1">
                <MdOutlineRouter size={20} className="mb-0.5" />
                <span className="font-medium">Router:</span>
                <Copy
                  text={router.id}
                  copyTitle={<span className="text-xs text-gray-400 dark:text-gray-200 font-medium">
                    {ellipseAddress(router.id, 6)}
                  </span>}
                />
                {network?.explorer?.url && (
                  <a
                    href={`${network.explorer.url}${network.explorer.address_path?.replace('{address}', router.id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-white"
                  >
                    {network.explorer.icon ?
                      <img
                        src={network.explorer.icon}
                        alt=""
                        className="w-4 h-4 rounded-full"
                      />
                      :
                      <TiArrowRight size={16} className="transform -rotate-45" />
                    }
                  </a>
                )}
              </div>
              :
              <div className="skeleton w-40 h-5" />
            }
            <div className="w-full grid grid-flow-row grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-8">
              {!router.skeleton ?
                router.assetBalances?.map((assetBalance, j) => (
                  <div key={j} className="h-40 bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-4">
                    <div className="space-y-2">
                      {assetBalance?.data && (
                        <div className="flex items-center space-x-1.5">
                          {assetBalance.data.logo_url && (
                            <Img
                              src={assetBalance.data.logo_url}
                              alt=""
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <div className="text-sm font-semibold">{assetBalance.data.contract_name}</div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs font-normal">{assetBalance.data.contract_ticker_symbol}</div>
                          </div>
                        </div>
                      )}
                      {assetBalance?.id && (
                        <div className="flex items-center space-x-1">
                          <Copy
                            text={assetBalance.id.replace(`-${router.id}`, '')}
                            copyTitle={<span className="text-gray-400 dark:text-gray-200 font-medium">
                              {ellipseAddress(assetBalance.id.replace(`-${router.id}`, ''), 6)}
                            </span>}
                          />
                          {network?.explorer?.url && (
                            <a
                              href={`${network.explorer.url}${network.explorer.contract_path?.replace('{address}', assetBalance.id.replace(`-${router.id}`, ''))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 dark:text-white"
                            >
                              {network.explorer.icon ?
                                <img
                                  src={network.explorer.icon}
                                  alt=""
                                  className="w-4 h-4 rounded-full"
                                />
                                :
                                <TiArrowRight size={16} className="transform -rotate-45" />
                              }
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <div className="uppercase text-gray-400 dark:text-gray-500 font-light" style={{ fontSize: '.65rem' }}>Liquidity</div>
                      <div>
                        <span className="font-mono text-lg font-semibold mr-1.5">{assetBalance?.normalize_amount ? numberFormat(assetBalance.normalize_amount, '0,0') : assetBalance?.amount && !(assetBalance?.data) ? numberFormat(assetBalance.amount / Math.pow(10, network?.currency?.decimals), '0,0') : '-'}</span>
                        <span className="text-gray-600 dark:text-gray-400 text-base">{assetBalance?.data?.contract_ticker_symbol}</span>
                      </div>
                    </div>
                  </div>
                ))
                :
                [...Array(3).keys()].map(j => (
                  <div key={j} className="skeleton h-40" style={{ borderRadius: '1rem' }} />
                ))
              }
            </div>
          </div>
        ))}
      </div>
      {/*<Datatable
        columns={[
          {
            Header: 'Tx Hash',
            accessor: 'transactionId',
            disableSortBy: true,
            Cell: props => (
              !props.row.original.skeleton ?
                <>
                  <div className="flex items-center space-x-1">
                    <Link href={`/tx/${props.value}`}>
                      <a className="uppercase text-indigo-600 dark:text-white font-medium">
                        {ellipseAddress(props.value, 6)}
                      </a>
                    </Link>
                    <Copy text={props.value} />
                  </div>
                  {props.row.original.chainTx && network?.explorer?.url && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Copy
                        size={12}
                        text={props.row.original.chainTx}
                        copyTitle={<span className="text-xs text-gray-400 dark:text-gray-600 font-light">
                          {ellipseAddress(props.row.original.chainTx, 6)}
                        </span>}
                      />
                      <a
                        href={`${network.explorer.url}${network.explorer.transaction_path?.replace('{tx}', props.row.original.chainTx)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-white"
                      >
                        {network?.explorer?.icon ?
                          <img
                            src={network.explorer.icon}
                            alt=""
                            className="w-4 h-4 rounded-full"
                          />
                          :
                          <TiArrowRight size={16} className="transform -rotate-45" />
                        }
                      </a>
                    </div>
                  )}
                </>
                :
                <>
                  <div className="skeleton w-32 h-4" />
                  <div className="skeleton w-24 h-3 mt-3" />
                </>
            ),
          },
          {
            Header: 'Status',
            accessor: 'status',
            disableSortBy: true,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className={`max-w-min bg-gray-100 dark:bg-${props.value === 'Fulfilled' ? 'green-600' : props.value === 'Prepared' ? 'indigo-500' : 'red-700'} rounded-lg flex items-center space-x-1 py-1 px-1.5`}>
                  {props.value === 'Fulfilled' ?
                    <FaCheckCircle size={14} className="text-green-500 dark:text-white" />
                    :
                    props.value === 'Prepared' ?
                      <FaClock size={14} className="text-gray-300 dark:text-white" />
                      :
                      <FaTimesCircle size={14} className="text-red-500 dark:text-white" />
                  }
                  <div className="uppercase text-xs text-gray-900 dark:text-white font-semibold">{props.value}</div>
                </div>
                :
                <div className="skeleton w-16 h-4" />
            ),
          },
          {
            Header: 'Caller',
            accessor: 'sendingAddress',
            disableSortBy: true,
            Cell: props => (
              !props.row.original.skeleton ?
                props.value ?
                  <>
                    <div className="flex items-center space-x-1">
                      <Copy
                        text={props.value}
                        copyTitle={<span className="text-xs text-gray-400 dark:text-gray-200 font-medium">
                          {ellipseAddress(props.value, 6)}
                        </span>}
                      />
                      {props.row.original.sendingChain?.explorer?.url && (
                        <a
                          href={`${props.row.original.sendingChain.explorer.url}${props.row.original.sendingChain.explorer.address_path?.replace('{address}', props.value)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-white"
                        >
                          {props.row.original.sendingChain.explorer.icon ?
                            <img
                              src={props.row.original.sendingChain.explorer.icon}
                              alt=""
                              className="w-4 h-4 rounded-full"
                            />
                            :
                            <TiArrowRight size={16} className="transform -rotate-45" />
                          }
                        </a>
                      )}
                    </div>
                    {props.row.original.sendingChain && (
                      <div className="flex items-center space-x-1.5 mt-1">
                        {props.row.original.sendingChain.icon && (
                          <img
                            src={props.row.original.sendingChain.icon}
                            alt=""
                            className="w-4 h-4 rounded-full"
                          />
                        )}
                        <span className="text-gray-700 dark:text-gray-300" style={{ fontSize: '.65rem' }}>{props.row.original.sendingChain.short_name || props.row.original.sendingChain.title}</span>
                      </div>
                    )}
                  </>
                  :
                  <span className="text-gray-400 dark:text-gray-600 font-light">Unknown</span>
                :
                <>
                  <div className="skeleton w-24 h-4" />
                  <div className="skeleton w-16 h-3 mt-3" />
                </>
            ),
          },
          {
            Header: 'Receiver',
            accessor: 'receivingAddress',
            disableSortBy: true,
            Cell: props => (
              !props.row.original.skeleton ?
                props.value ?
                  <>
                    <div className="flex items-center space-x-1">
                      <Copy
                        text={props.value}
                        copyTitle={<span className="text-xs text-gray-400 dark:text-gray-200 font-medium">
                          {ellipseAddress(props.value, 6)}
                        </span>}
                      />
                      {props.row.original.receivingChain?.explorer?.url && (
                        <a
                          href={`${props.row.original.receivingChain.explorer.url}${props.row.original.receivingChain.explorer.address_path?.replace('{address}', props.value)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-white"
                        >
                          {props.row.original.receivingChain.explorer.icon ?
                            <img
                              src={props.row.original.receivingChain.explorer.icon}
                              alt=""
                              className="w-4 h-4 rounded-full"
                            />
                            :
                            <TiArrowRight size={16} className="transform -rotate-45" />
                          }
                        </a>
                      )}
                    </div>
                    {props.row.original.receivingChain && (
                      <div className="flex items-center space-x-1.5 mt-1">
                        {props.row.original.receivingChain.icon && (
                          <img
                            src={props.row.original.receivingChain.icon}
                            alt=""
                            className="w-4 h-4 rounded-full"
                          />
                        )}
                        <span className="text-gray-700 dark:text-gray-300" style={{ fontSize: '.65rem' }}>{props.row.original.receivingChain.short_name || props.row.original.receivingChain.title}</span>
                      </div>
                    )}
                  </>
                  :
                  <span className="text-gray-400 dark:text-gray-600 font-light">Unknown</span>
                :
                <>
                  <div className="skeleton w-24 h-4" />
                  <div className="skeleton w-16 h-3 mt-3" />
                </>
            ),
          },
          {
            Header: 'Asset',
            accessor: 'normalize_amount',
            disableSortBy: true,
            Cell: props => (
              !props.row.original.skeleton ?
                <>
                  <div className="flex flex-row items-center justify-end space-x-2">
                    {props.row.original.sendingAssetId ?
                      <div className="flex flex-col">
                        {props.row.original.sendingAsset && (
                          <a
                            href={`${props.row.original.sendingChain?.explorer?.url}${props.row.original.sendingChain?.explorer?.contract_path?.replace('{address}', props.row.original.sendingAssetId)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1.5"
                          >
                            {props.row.original.sendingAsset.logo_url && (
                              <Img
                                src={props.row.original.sendingAsset.logo_url}
                                alt=""
                                className="w-5 h-5 rounded-full"
                              />
                            )}
                            <span className="text-xs font-medium">{props.row.original.sendingAsset.contract_ticker_symbol || props.row.original.sendingAsset.contract_name}</span>
                          </a>
                        )}
                        <div className="flex items-center space-x-1">
                          <Copy
                            size={12}
                            text={props.row.original.sendingAssetId}
                            copyTitle={<span className="text-gray-400 dark:text-gray-200 font-medium" style={{ fontSize: '.65rem' }}>
                              {ellipseAddress(props.row.original.sendingAssetId, 6)}
                            </span>}
                          />
                          {!props.row.original.sendingAsset && props.row.original.sendingChain?.explorer?.url && (
                            <a
                              href={`${props.row.original.sendingChain.explorer.url}${props.row.original.sendingChain.explorer.contract_path?.replace('{address}', props.row.original.sendingAssetId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 dark:text-white"
                            >
                              {props.row.original.sendingChain.explorer.icon ?
                                <img
                                  src={props.row.original.sendingChain.explorer.icon}
                                  alt=""
                                  className="w-4 h-4 rounded-full"
                                />
                                :
                                <TiArrowRight size={16} className="transform -rotate-45" />
                              }
                            </a>
                          )}
                        </div>
                      </div>
                      :
                      <span className="text-gray-400 dark:text-gray-600 font-light">-</span>
                    }
                    <TiArrowRight size={18} />
                    {props.row.original.receivingAssetId ?
                      <div className="flex flex-col">
                        {props.row.original.receivingAsset && (
                          <a
                            href={`${props.row.original.receivingChain?.explorer?.url}${props.row.original.receivingChain?.explorer?.contract_path?.replace('{address}', props.row.original.receivingAssetId)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1.5"
                          >
                            {props.row.original.receivingAsset.logo_url && (
                              <Img
                                src={props.row.original.receivingAsset.logo_url}
                                alt=""
                                className="w-5 h-5 rounded-full"
                              />
                            )}
                            <span className="text-xs font-medium">{props.row.original.receivingAsset.contract_ticker_symbol || props.row.original.receivingAsset.contract_name}</span>
                          </a>
                        )}
                        <div className="flex items-center space-x-1">
                          <Copy
                            size={12}
                            text={props.row.original.receivingAssetId}
                            copyTitle={<span className="text-gray-400 dark:text-gray-200 font-medium" style={{ fontSize: '.65rem' }}>
                              {ellipseAddress(props.row.original.receivingAssetId, 6)}
                            </span>}
                          />
                          {!props.row.original.receivingAsset && props.row.original.receivingChain?.explorer?.url && (
                            <a
                              href={`${props.row.original.receivingChain.explorer.url}${props.row.original.receivingChain.explorer.contract_path?.replace('{address}', props.row.original.receivingAssetId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 dark:text-white"
                            >
                              {props.row.original.receivingChain.explorer.icon ?
                                <img
                                  src={props.row.original.receivingChain.explorer.icon}
                                  alt=""
                                  className="w-4 h-4 rounded-full"
                                />
                                :
                                <TiArrowRight size={16} className="transform -rotate-45" />
                              }
                            </a>
                          )}
                        </div>
                      </div>
                      :
                      <span className="text-gray-400 dark:text-gray-600 font-light">-</span>
                    }
                  </div>
                  {props.value && (
                    <div className="max-w-min bg-gray-100 dark:bg-gray-800 rounded text-xs space-x-1 mt-1.5 mb-1 ml-auto py-0.5 px-1.5">
                      <span className="font-semibold">{numberFormat(props.value, '0,0.00000000')}</span>
                      <span className="uppercase text-gray-600 dark:text-gray-400">{props.row.original.sendingAsset?.contract_ticker_symbol || props.row.original.receivingAsset?.contract_ticker_symbol}</span>
                    </div>
                  )}
                </>
                :
                <>
                  <div className="skeleton w-32 h-4 ml-auto" />
                  <div className="skeleton w-24 h-3 mt-3 ml-auto" />
                </>
            ),
            headerClassName: 'justify-end text-right',
          },
          {
            Header: 'Time',
            accessor: 'preparedTimestamp',
            disableSortBy: true,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="text-right">
                  <span className="text-gray-400 dark:text-gray-600">
                    {Number(moment().diff(moment(props.value), 'second')) > 59 ?
                      moment(props.value).fromNow()
                      :
                      <>{moment().diff(moment(props.value), 'second')}s ago</>
                    }
                  </span>
                </div>
                :
                <div className="skeleton w-18 h-4 ml-auto" />
            ),
            headerClassName: 'justify-end text-right',
          },
        ]}
        data={transactions?.chain_id === chain_id ?
          (transactions.data || []).map((transaction, i) => { return { ...transaction, i } })
          :
          [...Array(10).keys()].map(i => { return { i, skeleton: true } })
        }
        noPagination={!transactions || transactions?.data?.length <= 10 ? true : false}
        defaultPageSize={10}
        className={`min-h-full ${className}`}
      />*/}
      {data && data.chain_id === chain_id && !(data.data?.length > 0) && (
        <div className="bg-transparent border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-700 text-gray-300 dark:text-gray-700 text-base font-medium italic text-center py-16">
          No Assets
        </div>
      )}
    </>
  )
}