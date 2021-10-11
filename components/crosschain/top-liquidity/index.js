import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { Img } from 'react-image'
import { TiArrowRight } from 'react-icons/ti'

import Datatable from '../../datatable'
import Copy from '../../copy'

import { currency, currency_symbol } from '../../../lib/object/currency'
import { networks } from '../../../lib/menus'
import { numberFormat, ellipseAddress } from '../../../lib/utils'

import { CONTRACTS_DATA } from '../../../reducers/types'

export default function TopLiquidity({ n, className = '' }) {
  const { contracts, assets } = useSelector(state => ({ contracts: state.contracts, assets: state.assets }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }

  const [assetBalances, setAssetBalances] = useState(null)

  useEffect(() => {
    if (assets_data) {
      const data = _.orderBy(
        Object.values(assets_data).flatMap(asset_data => asset_data.map(asset => {
          return {
            ...asset,
            data: contracts_data?.find(contract => contract.id === asset.contract_address)?.data,
          }
        }).map(asset => {
          return {
            ...asset,
            normalize_amount: asset?.data?.contract_decimals && (asset.amount / Math.pow(10, asset.data.contract_decimals)),
          }
        }).map(asset => {
          return {
            ...asset,
            value: typeof asset?.normalize_amount === 'number' && typeof asset?.data?.prices?.[0].price === 'number' && (asset?.normalize_amount * asset?.data?.prices?.[0].price),
          }
        })),
        ['value', 'normalize_amount'], ['desc', 'desc']
      )

      setAssetBalances({ data: data && typeof n === 'number' ? _.slice(data, 0, n) : data })
    }
  }, [contracts_data, assets_data])

  return (
    <>
      <Datatable
        columns={[
          {
            Header: '#',
            accessor: 'i',
            sortType: (rowA, rowB) => rowA.original.i > rowB.original.i ? 1 : -1,
            Cell: props => (
              !props.row.original.skeleton ?
                props.value > -1 ?
                  <span>{numberFormat(props.value + 1, '0,0')}</span>
                  :
                  <span>-</span>
                :
                <div className="skeleton w-6 h-4" />
            ),
          },
          {
            Header: 'Token',
            accessor: 'data.contract_name',
            Cell: props => (
              !props.row.original.skeleton && props.row.original.data ?
                props.row.original.data.contract_address ?
                  <>
                    <div className="flex items-center space-x-1.5">
                      {props.row.original.data.logo_url && (
                        <Img
                          src={props.row.original.data.logo_url}
                          alt=""
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <span className="font-semibold">{props.value}</span>
                      {props.row.original.data.contract_ticker_symbol && (
                        <span className="text-gray-600 dark:text-gray-400" style={{ fontSize: '.65rem' }}>{props.row.original.data.contract_ticker_symbol}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <Copy
                        text={props.row.original.data.contract_address}
                        copyTitle={<span className="text-gray-400 dark:text-gray-200 text-xs font-medium">
                          {ellipseAddress(props.row.original.data.contract_address, 6)}
                        </span>}
                      />
                      {props.row.original.chain_data?.explorer?.url && (
                        <a
                          href={`${props.row.original.chain_data.explorer.url}${props.row.original.chain_data.explorer.contract_path?.replace('{address}', props.row.original.contract_address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-white"
                        >
                          {props.row.original.chain_data.explorer.icon ?
                            <img
                              src={props.row.original.chain_data.explorer.icon}
                              alt=""
                              className="w-4 h-4 rounded-full"
                            />
                            :
                            <TiArrowRight size={16} className="transform -rotate-45" />
                          }
                        </a>
                      )}
                    </div>
                  </>
                  :
                  <span className="text-gray-400 dark:text-gray-600 font-light">Unknown</span>
                :
                <>
                  <div className="skeleton w-32 h-4" />
                  <div className="skeleton w-24 h-3 mt-3" />
                </>
            ),
          },
          {
            Header: 'Chain',
            accessor: 'chain_data.short_name',
            Cell: props => (
              !props.row.original.skeleton && props.row.original.data ?
                props.value ?
                  <Link href={`/${props.row.original.chain_data?.id}`}>
                    <a className="flex items-start text-indigo-600 dark:text-white space-x-1.5">
                      {props.row.original.chain_data?.icon && (
                        <img
                          src={props.row.original.chain_data.icon}
                          alt=""
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <div>
                        <div className="font-medium">{props.value}</div>
                        {props.row.original.chain_data?.title && (
                          <div className="text-gray-700 dark:text-gray-300 mt-1" style={{ fontSize: '.65rem' }}>{props.row.original.chain_data.title}</div>
                        )}
                      </div>
                    </a>
                  </Link>
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
            Header: 'Liquidity',
            accessor: 'normalize_amount',
            disableSortBy: true,
            Cell: props => (
              !props.row.original.skeleton && props.row.original.data ?
                <div className="text-right space-x-1 mr-4">
                  <span className="font-mono font-semibold">
                    {numberFormat(props.value, '0,0')}
                  </span>
                  {props.row.original.data.contract_ticker_symbol && (
                    <span className="text-gray-600 dark:text-gray-400 text-xs">{props.row.original.data.contract_ticker_symbol}</span>
                  )}
                </div>
                :
                <div className="skeleton w-16 h-4 ml-auto mr-4" />
            ),
            headerClassName: 'justify-end text-right mr-4',
          },
          {
            Header: `Value (${currency})`,
            accessor: 'value',
            sortType: (rowA, rowB) => rowA.original.value > rowB.original.value ? 1 : -1,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="font-semibold text-right space-x-1">
                  {currency_symbol}
                  {numberFormat(props.value, '0,0')}
                </div>
                :
                <div className="skeleton w-16 h-4 ml-auto" />
            ),
            headerClassName: 'justify-end text-right',
          },
          // {
          //   Header: 'Txn Hash',
          //   accessor: 'transactionId',
          //   disableSortBy: true,
          //   Cell: props => (
          //     !props.row.original.skeleton ?
          //       <>
          //         <div className="flex items-center space-x-1 mb-1">
          //           <Link href={`/tx/${props.value}`}>
          //             <a className="uppercase text-indigo-600 dark:text-white font-medium">
          //               {ellipseAddress(props.value, 6)}
          //             </a>
          //           </Link>
          //           <Copy text={props.value} />
          //         </div>
          //         {props.row.original.txs?.filter(tx => tx.id && networks.find(network => network?.network_id === tx.chain_id && network?.explorer?.url)).map((tx, i) => (
          //           <div key={i} className="flex items-center space-x-1">
          //             <Copy
          //               size={12}
          //               text={tx.id}
          //               copyTitle={<span className="text-gray-400 dark:text-gray-600 text-xs font-light">
          //                 {ellipseAddress(tx.id, 6)}
          //               </span>}
          //             />
          //             <a
          //               href={`${networks.find(network => network.network_id === tx.chain_id).explorer.url}${networks.find(network => network.network_id === tx.chain_id).explorer.transaction_path?.replace('{tx}', tx.id)}`}
          //               target="_blank"
          //               rel="noopener noreferrer"
          //               className="text-indigo-600 dark:text-white"
          //             >
          //               {networks.find(network => network.network_id === tx.chain_id).explorer.icon ?
          //                 <img
          //                   src={networks.find(network => network.network_id === tx.chain_id).explorer.icon}
          //                   alt=""
          //                   className="w-4 h-4 rounded-full"
          //                 />
          //                 :
          //                 <TiArrowRight size={16} className="transform -rotate-45" />
          //               }
          //             </a>
          //           </div>
          //         ))}
          //       </>
          //       :
          //       <>
          //         <div className="skeleton w-32 h-4" />
          //         <div className="skeleton w-24 h-3 mt-3" />
          //       </>
          //   ),
          // },
          // {
          //   Header: 'Status',
          //   accessor: 'status',
          //   disableSortBy: true,
          //   Cell: props => (
          //     !props.row.original.skeleton ?
          //       <div className={`max-w-min bg-gray-100 dark:bg-${props.value === 'Fulfilled' ? 'green-600' : props.value === 'Prepared' ? 'indigo-500' : 'red-700'} rounded-lg flex items-center space-x-1 py-1 px-1.5`}>
          //         {props.value === 'Fulfilled' ?
          //           <FaCheckCircle size={14} className="text-green-500 dark:text-white" />
          //           :
          //           props.value === 'Prepared' ?
          //             <FaClock size={14} className="text-gray-300 dark:text-white" />
          //             :
          //             <FaTimesCircle size={14} className="text-red-500 dark:text-white" />
          //         }
          //         <div className="uppercase text-gray-900 dark:text-white text-xs font-semibold">{props.value}</div>
          //       </div>
          //       :
          //       <div className="skeleton w-16 h-4" />
          //   ),
          // },
          // {
          //   Header: 'Initiator',
          //   accessor: 'sendingAddress',
          //   disableSortBy: true,
          //   Cell: props => (
          //     !props.row.original.skeleton ?
          //       props.value ?
          //         <div className="min-w-max">
          //           <div className="flex items-center space-x-1">
          //             <Link href={`/address/${props.value}`}>
          //               <a className="uppercase text-indigo-600 dark:text-white text-xs font-medium">
          //                 {ellipseAddress(props.value, 6)}
          //               </a>
          //             </Link>
          //             <Copy text={props.value} />
          //             {props.row.original.sendingChain?.explorer?.url && (
          //               <a
          //                 href={`${props.row.original.sendingChain.explorer.url}${props.row.original.sendingChain.explorer.address_path?.replace('{address}', props.value)}`}
          //                 target="_blank"
          //                 rel="noopener noreferrer"
          //                 className="text-indigo-600 dark:text-white"
          //               >
          //                 {props.row.original.sendingChain.explorer.icon ?
          //                   <img
          //                     src={props.row.original.sendingChain.explorer.icon}
          //                     alt=""
          //                     className="w-4 h-4 rounded-full"
          //                   />
          //                   :
          //                   <TiArrowRight size={16} className="transform -rotate-45" />
          //                 }
          //               </a>
          //             )}
          //           </div>
          //           {props.row.original.sendingChain && (
          //             <div className="flex items-center space-x-1.5 mt-1">
          //               {props.row.original.sendingChain.icon && (
          //                 <img
          //                   src={props.row.original.sendingChain.icon}
          //                   alt=""
          //                   className="w-4 h-4 rounded-full"
          //                 />
          //               )}
          //               <span className="text-gray-700 dark:text-gray-300" style={{ fontSize: '.65rem' }}>{props.row.original.sendingChain.short_name || props.row.original.sendingChain.title}</span>
          //             </div>
          //           )}
          //         </div>
          //         :
          //         <span className="text-gray-400 dark:text-gray-600 font-light">Unknown</span>
          //       :
          //       <>
          //         <div className="skeleton w-24 h-4" />
          //         <div className="skeleton w-16 h-3 mt-3" />
          //       </>
          //   ),
          // },
          // {
          //   Header: 'Receiver',
          //   accessor: 'receivingAddress',
          //   disableSortBy: true,
          //   Cell: props => (
          //     !props.row.original.skeleton ?
          //       props.value ?
          //         <div className="min-w-max">
          //           <div className="flex items-center space-x-1">
          //             <Link href={`/address/${props.value}`}>
          //               <a className="uppercase text-indigo-600 dark:text-white text-xs font-medium">
          //                 {ellipseAddress(props.value, 6)}
          //               </a>
          //             </Link>
          //             <Copy text={props.value} />
          //             {props.row.original.receivingChain?.explorer?.url && (
          //               <a
          //                 href={`${props.row.original.receivingChain.explorer.url}${props.row.original.receivingChain.explorer.address_path?.replace('{address}', props.value)}`}
          //                 target="_blank"
          //                 rel="noopener noreferrer"
          //                 className="text-indigo-600 dark:text-white"
          //               >
          //                 {props.row.original.receivingChain.explorer.icon ?
          //                   <img
          //                     src={props.row.original.receivingChain.explorer.icon}
          //                     alt=""
          //                     className="w-4 h-4 rounded-full"
          //                   />
          //                   :
          //                   <TiArrowRight size={16} className="transform -rotate-45" />
          //                 }
          //               </a>
          //             )}
          //           </div>
          //           {props.row.original.receivingChain && (
          //             <div className="flex items-center space-x-1.5 mt-1">
          //               {props.row.original.receivingChain.icon && (
          //                 <img
          //                   src={props.row.original.receivingChain.icon}
          //                   alt=""
          //                   className="w-4 h-4 rounded-full"
          //                 />
          //               )}
          //               <span className="text-gray-700 dark:text-gray-300" style={{ fontSize: '.65rem' }}>{props.row.original.receivingChain.short_name || props.row.original.receivingChain.title}</span>
          //             </div>
          //           )}
          //         </div>
          //         :
          //         <span className="text-gray-400 dark:text-gray-600 font-light">Unknown</span>
          //       :
          //       <>
          //         <div className="skeleton w-24 h-4" />
          //         <div className="skeleton w-16 h-3 mt-3" />
          //       </>
          //   ),
          // },
          // {
          //   Header: 'Asset',
          //   accessor: 'normalize_amount',
          //   disableSortBy: true,
          //   Cell: props => (
          //     !props.row.original.skeleton ?
          //       <>
          //         <div className="flex flex-row items-center justify-end space-x-2">
          //           {props.row.original.sendingAssetId ?
          //             <div className="flex flex-col">
          //               {props.row.original.sendingAsset && (
          //                 <a
          //                   href={`${props.row.original.sendingChain?.explorer?.url}${props.row.original.sendingChain?.explorer?.contract_path?.replace('{address}', props.row.original.sendingAssetId)}`}
          //                   target="_blank"
          //                   rel="noopener noreferrer"
          //                   className="flex items-center space-x-1.5"
          //                 >
          //                   {props.row.original.sendingAsset.logo_url && (
          //                     <Img
          //                       src={props.row.original.sendingAsset.logo_url}
          //                       alt=""
          //                       className="w-5 h-5 rounded-full"
          //                     />
          //                   )}
          //                   <span className="text-xs font-medium">{props.row.original.sendingAsset.contract_ticker_symbol || props.row.original.sendingAsset.contract_name}</span>
          //                 </a>
          //               )}
          //               <div className="flex items-center space-x-1">
          //                 <Copy
          //                   size={12}
          //                   text={props.row.original.sendingAssetId}
          //                   copyTitle={<span className="text-gray-400 dark:text-gray-200 font-medium" style={{ fontSize: '.65rem' }}>
          //                     {ellipseAddress(props.row.original.sendingAssetId, 6)}
          //                   </span>}
          //                 />
          //                 {!props.row.original.sendingAsset && props.row.original.sendingChain?.explorer?.url && (
          //                   <a
          //                     href={`${props.row.original.sendingChain.explorer.url}${props.row.original.sendingChain.explorer.contract_path?.replace('{address}', props.row.original.sendingAssetId)}`}
          //                     target="_blank"
          //                     rel="noopener noreferrer"
          //                     className="text-indigo-600 dark:text-white"
          //                   >
          //                     {props.row.original.sendingChain.explorer.icon ?
          //                       <img
          //                         src={props.row.original.sendingChain.explorer.icon}
          //                         alt=""
          //                         className="w-4 h-4 rounded-full"
          //                       />
          //                       :
          //                       <TiArrowRight size={16} className="transform -rotate-45" />
          //                     }
          //                   </a>
          //                 )}
          //               </div>
          //             </div>
          //             :
          //             <span className="text-gray-400 dark:text-gray-600 font-light">-</span>
          //           }
          //           <TiArrowRight size={18} />
          //           {props.row.original.receivingAssetId ?
          //             <div className="flex flex-col">
          //               {props.row.original.receivingAsset && (
          //                 <a
          //                   href={`${props.row.original.receivingChain?.explorer?.url}${props.row.original.receivingChain?.explorer?.contract_path?.replace('{address}', props.row.original.receivingAssetId)}`}
          //                   target="_blank"
          //                   rel="noopener noreferrer"
          //                   className="flex items-center space-x-1.5"
          //                 >
          //                   {props.row.original.receivingAsset.logo_url && (
          //                     <Img
          //                       src={props.row.original.receivingAsset.logo_url}
          //                       alt=""
          //                       className="w-5 h-5 rounded-full"
          //                     />
          //                   )}
          //                   <span className="text-xs font-medium">{props.row.original.receivingAsset.contract_ticker_symbol || props.row.original.receivingAsset.contract_name}</span>
          //                 </a>
          //               )}
          //               <div className="flex items-center space-x-1">
          //                 <Copy
          //                   size={12}
          //                   text={props.row.original.receivingAssetId}
          //                   copyTitle={<span className="text-gray-400 dark:text-gray-200 font-medium" style={{ fontSize: '.65rem' }}>
          //                     {ellipseAddress(props.row.original.receivingAssetId, 6)}
          //                   </span>}
          //                 />
          //                 {!props.row.original.receivingAsset && props.row.original.receivingChain?.explorer?.url && (
          //                   <a
          //                     href={`${props.row.original.receivingChain.explorer.url}${props.row.original.receivingChain.explorer.contract_path?.replace('{address}', props.row.original.receivingAssetId)}`}
          //                     target="_blank"
          //                     rel="noopener noreferrer"
          //                     className="text-indigo-600 dark:text-white"
          //                   >
          //                     {props.row.original.receivingChain.explorer.icon ?
          //                       <img
          //                         src={props.row.original.receivingChain.explorer.icon}
          //                         alt=""
          //                         className="w-4 h-4 rounded-full"
          //                       />
          //                       :
          //                       <TiArrowRight size={16} className="transform -rotate-45" />
          //                     }
          //                   </a>
          //                 )}
          //               </div>
          //             </div>
          //             :
          //             <span className="text-gray-400 dark:text-gray-600 font-light">-</span>
          //           }
          //         </div>
          //         {props.value && (
          //           <div className="max-w-min bg-gray-100 dark:bg-gray-800 rounded text-xs space-x-1 mt-1.5 mb-1 ml-auto py-0.5 px-1.5">
          //             <span className="font-semibold">{numberFormat(props.value, '0,0.00000000')}</span>
          //             <span className="uppercase text-gray-600 dark:text-gray-400">{props.row.original.sendingAsset?.contract_ticker_symbol || props.row.original.receivingAsset?.contract_ticker_symbol}</span>
          //           </div>
          //         )}
          //       </>
          //       :
          //       <>
          //         <div className="skeleton w-32 h-4 ml-auto" />
          //         <div className="skeleton w-24 h-3 mt-3 ml-auto" />
          //       </>
          //   ),
          //   headerClassName: 'justify-end text-right',
          // },
          // {
          //   Header: 'Time',
          //   accessor: 'preparedTimestamp',
          //   disableSortBy: true,
          //   Cell: props => (
          //     !props.row.original.skeleton ?
          //       <div className="text-right">
          //         <span className="text-gray-400 dark:text-gray-600">
          //           {Number(moment().diff(moment(props.value), 'second')) > 59 ?
          //             moment(props.value).fromNow()
          //             :
          //             <>{moment().diff(moment(props.value), 'second')}s ago</>
          //           }
          //         </span>
          //       </div>
          //       :
          //       <div className="skeleton w-20 h-4 ml-auto" />
          //   ),
          //   headerClassName: 'justify-end text-right',
          // },
        ]}
        data={assetBalances ?
          (assetBalances.data || []).map((assetBalance, i) => { return { ...assetBalance, i } })
          :
          [...Array(10).keys()].map(i => { return { i, skeleton: true } })
        }
        noPagination={!assetBalances || assetBalances.data?.length <= 10 ? true : false}
        defaultPageSize={100}
        className={`min-h-full ${className}`}
      />
      {assetBalances && !(assetBalances.data?.length > 0) && (
        <div className="bg-white dark:bg-gray-900 text-gray-300 dark:text-gray-500 text-base font-medium italic text-center my-4 py-2">
          No Liquidity Provided
        </div>
      )}
    </>
  )
}