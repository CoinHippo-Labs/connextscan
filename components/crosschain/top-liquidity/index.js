import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { Img } from 'react-image'
import { MdOutlineRouter } from 'react-icons/md'
import { TiArrowRight } from 'react-icons/ti'

import Datatable from '../../datatable'
import Copy from '../../copy'
import { ProgressBar } from '../../progress-bars'

import { currency, currency_symbol } from '../../../lib/object/currency'
import { numberFormat, ellipseAddress } from '../../../lib/utils'

export default function TopLiquidity({ n, className = '' }) {
  const { contracts, assets } = useSelector(state => ({ contracts: state.contracts, assets: state.assets }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }

  const [assetBalances, setAssetBalances] = useState(null)

  useEffect(() => {
    if (assets_data) {
      let data = _.orderBy(
        Object.values(assets_data).flatMap(asset_data => asset_data.map(asset => {
          return {
            ...asset,
            data: contracts_data?.find(contract => contract.id?.replace(`${asset?.chain_data?.id}-`, '') === asset?.contract_address)?.data,
          }
        }).map(asset => {
          return {
            ...asset,
            normalize_amount: asset?.data?.contract_decimals && (asset.amount / Math.pow(10, asset.data.contract_decimals)),
          }
        }).map(asset => {
          return {
            ...asset,
            value: typeof asset?.normalize_amount === 'number' && typeof asset?.data?.prices?.[0]?.price === 'number' && (asset.normalize_amount * asset.data.prices[0].price),
          }
        })),
        ['value', 'normalize_amount'], ['desc', 'desc']
      )

      data = data?.map(asset => {
        return {
          ...asset,
          proportion: asset?.value / _.sumBy(data, 'value'),
        }
      })

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
                        <span className="text-gray-600 dark:text-gray-400 text-2xs">{props.row.original.data.contract_ticker_symbol}</span>
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
                              className="w-4 h-4 rounded-full opacity-60 hover:opacity-100"
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
                <div className="skeleton w-20 h-4 ml-auto mr-4" />
            ),
            headerClassName: 'justify-end text-right mr-4',
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
                          <div className="text-gray-700 dark:text-gray-300 text-2xs mt-1">{props.row.original.chain_data.title}</div>
                        )}
                      </div>
                    </a>
                  </Link>
                  :
                  <span className="text-gray-400 dark:text-gray-600 font-light">Unknown</span>
                :
                <>
                  <div className="skeleton w-28 h-4" />
                  <div className="skeleton w-20 h-3 mt-3" />
                </>
            ),
          },
          {
            Header: 'Router',
            accessor: 'router.id',
            Cell: props => (
              !props.row.original.skeleton && props.row.original.data ?
                props.value ?
                  <div className="flex items-center space-x-1">
                    <MdOutlineRouter size={20} className="text-gray-400 dark:text-gray-600 mb-0.5" />
                    <Link href={`/router/${props.value}`}>
                      <a className="text-indigo-600 dark:text-white text-xs font-medium">
                        {ellipseAddress(props.value, 6)}
                      </a>
                    </Link>
                    <Copy text={props.value} />
                  </div>
                  :
                  <span className="text-gray-400 dark:text-gray-600 font-light">Unknown</span>
                :
                <div className="skeleton w-36 h-4" />
            ),
          },
          {
            Header: `Value (${currency})`,
            accessor: 'value',
            sortType: (rowA, rowB) => rowA.original.value > rowB.original.value ? 1 : -1,
            Cell: props => (
              !props.row.original.skeleton && props.row.original.data ?
                <div className="font-semibold text-right space-x-1 mr-4">
                  {currency_symbol}
                  {numberFormat(props.value, '0,0')}
                </div>
                :
                <div className="skeleton w-16 h-4 ml-auto mr-4" />
            ),
            headerClassName: 'justify-end text-right mr-4',
          },
          {
            Header: 'Proportion',
            accessor: 'proportion',
            sortType: (rowA, rowB) => rowA.original.proportion > rowB.original.proportion ? 1 : -1,
            Cell: props => (
              <div className="flex flex-col text-gray-600 dark:text-gray-400 font-normal">
                {!props.row.original.skeleton && props.row.original.data ?
                  <>
                    <span>{props.value > -1 ? `${numberFormat(props.value * 100, `0,0.000${Math.abs(props.value * 100) < 0.001 ? '000' : ''}`)}%` : '-'}</span>
                    <ProgressBar width={props.value > -1 ? props.value * 100 : 0} color="bg-yellow-500" className="h-1" />
                  </>
                  :
                  <>
                    <div className="skeleton w-12 h-4 rounded" />
                    <div className={`skeleton w-${Math.floor((12 - props.row.original.i) / 3)}/12 h-1 rounded mt-1.5`} />
                  </>
                }
              </div>
            ),
          },
        ]}
        data={assetBalances?.data && !(assetBalances?.data?.findIndex(assetBalance => assetBalance?.data) < 0) ?
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