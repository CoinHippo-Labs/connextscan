import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { Img } from 'react-image'
import { IoCaretUpOutline, IoCaretDownOutline } from 'react-icons/io5'

import Datatable from '../datatable'
import Copy from '../copy'
import { ProgressBar } from '../progress-bars'

import { currency_symbol } from '../../lib/object/currency'
import { numberFormat } from '../../lib/utils'

const COLLAPSE_TOKENS_SIZE = 3

export default function TopChains({ className = '' }) {
  const { assets, routers_assets } = useSelector(state => ({ assets: state.assets, routers_assets: state.routers_assets }), shallowEqual)
  const { assets_data } = { ...assets }
  const { routers_assets_data } = { ...routers_assets }

  const [chainsVolume, setChainsVolume] = useState(null)
  const [tokensSeeMore, setTokensSeeMore] = useState([])

  useEffect(() => {
    if (assets_data && routers_assets_data) {
      let data = _.orderBy(Object.values(routers_assets_data).flatMap(ra => ra?.asset_balances || []), ['volume_value', 'volume'], ['desc', 'desc'])

      data = _.orderBy(Object.entries(_.groupBy(data.map(ab => {
        const asset = assets_data?.find(a => a?.contracts?.findIndex(c => c?.chain_id === ab?.asset?.chain_id && c?.contract_address === ab.asset.contract_address) > -1)

        return {
          ...ab,
          symbol: asset?.symbol || ab?.asset?.symbol?.substring(0, ab.asset.symbol.includes('.') ? ab.asset.symbol.indexOf('.') : ab.asset.symbol.length).split('').filter(c => c === c.toUpperCase()).join(''),
          general_asset: asset,
        }
      }), 'chain.chain_id')).map(([key, value]) => {
        return {
          ..._.maxBy(value, ['volume_value']),
          amount: _.sumBy(value, 'amount'),
          amount_value: _.sumBy(value, 'amount_value'),
          volume: _.sumBy(value, 'volume'),
          volume_value: _.sumBy(value, 'volume_value'),
          assets: _.groupBy(value, 'symbol'),
        }
      }), ['volume_value', 'volume', 'amount_value', 'amount'], ['desc', 'desc', 'desc', 'desc'])

      data = data.map(c => {
        return {
          ...c,
          proportion: c?.volume_value / _.sumBy(data, 'volume_value'),
        }
      })

      setChainsVolume({ data })
    }
  }, [assets_data, routers_assets_data])

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
                <div className={`font-mono ${props.value < 3 ? 'font-semibold' : ''} my-1`}>
                  {numberFormat(props.value + 1, '0,0')}
                </div>
                :
                <div className="skeleton w-6 h-5 my-1" />
            ),
          },
          {
            Header: 'Chain',
            accessor: 'chain.title',
            sortType: (rowA, rowB) => rowA.original.chain?.title > rowB.original.chain?.title ? 1 : -1,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="flex items-center space-x-1.5 my-1">
                  <Img
                    src={props.row.original.chain?.image}
                    alt=""
                    className="w-5 h-5 rounded-full"
                  />
                  <span className={`${props.row.original.i < 3 ? 'font-semibold' : 'font-medium'}`}>{props.value || props.row.original.chain?.short_name}</span>
                </div>
                :
                <div className="skeleton w-32 h-5 my-1" />
            ),
          },
          {
            Header: 'Tokens',
            accessor: 'assets',
            sortType: (rowA, rowB) => rowA.original.amount_value > rowB.original.amount_value ? 1 : rowA.original.amount_value < rowB.original.amount_value ? -1 : rowA.original.amount > rowB.original.amount ? 1 : -1,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="flex flex-col space-y-1.5 my-1">
                  {_.slice(_.orderBy(Object.entries(props.value || {}).filter(([key, value]) => value?.length > 0), entry => -1 * _.maxBy(entry[1], 'amount')?.amount), 0, tokensSeeMore.includes(props.row.original.symbol) ? Object.entries(props.value).filter(([key, value]) => value?.length > 0).length : COLLAPSE_TOKENS_SIZE).map(([key, value]) => (
                    <Link key={key} href={`/${_.maxBy(value, 'amount')?.chain?.id}`}>
                      <a className="flex items-center justify-end text-xs space-x-1.5">
                        <span className={`font-mono uppercase ${_.sumBy(value, 'amount_value') > 1000000 ? 'font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                          {numberFormat(_.sumBy(value, 'amount'), _.sumBy(value, 'amount') > 1000000 ? '0,0.00a' : _.sumBy(value, 'amount') > 1000 ? '0,0' : '0,0.00')}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {_.maxBy(value, 'amount')?.asset?.symbol}
                        </span>
                        <Img
                          src={[_.maxBy(value, 'amount')?.asset?.image]}
                          alt=""
                          className="w-5 h-5 rounded-full"
                        />
                      </a>
                    </Link>
                  ))}
                  {(Object.entries(props.value || {}).filter(([key, value]) => value?.length > 0).length > COLLAPSE_TOKENS_SIZE || tokensSeeMore.includes(props.row.original.symbol)) && (
                    <div
                      onClick={() => setTokensSeeMore(tokensSeeMore.includes(props.row.original.symbol) ? tokensSeeMore.filter(s => s !== props.row.original.symbol) : _.uniq(_.concat(tokensSeeMore, props.row.original.symbol)))}
                      className="max-w-min cursor-pointer rounded flex items-center capitalize font-mono text-gray-400 dark:text-gray-600 text-2xs font-medium space-x-1 ml-auto mr-1"
                    >
                      <span>See {tokensSeeMore.includes(props.row.original.symbol) ? 'Less' : 'More'}</span>
                      {!(tokensSeeMore.includes(props.row.original.symbol)) && (
                        <span>({numberFormat(Object.entries(props.value || {}).filter(([key, value]) => value?.length > 0).length - COLLAPSE_TOKENS_SIZE, '0,0')})</span>
                      )}
                      {tokensSeeMore.includes(props.row.original.symbol) ? <IoCaretUpOutline /> : <IoCaretDownOutline />}
                    </div>
                  )}
                </div>
                :
                <div className="flex flex-col space-y-2 my-1">
                  {[...Array(COLLAPSE_TOKENS_SIZE).keys()].map(i => (
                    <div key={i} className="skeleton w-28 h-5 ml-auto" />
                  ))}
                </div>
            ),
            headerClassName: 'whitespace-nowrap justify-end text-right',
          },
          {
            Header: 'Liquidity',
            accessor: 'amount',
            sortType: (rowA, rowB) => rowA.original.amount_value > rowB.original.amount_value ? 1 : rowA.original.amount_value < rowB.original.amount_value ? -1 : rowA.original.amount > rowB.original.amount ? 1 : -1,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="flex flex-col items-end space-y-1.5 my-1">
                  <div className="flex items-center space-x-1.5">
                    <span className={`font-mono uppercase text-xs ${props.row.original.amount_value > 1000000 ? 'font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                      {numberFormat(props.value, props.value > 10000000 ? '0,0.00a' : props.value > 1000 ? '0,0' : '0,0.00')}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {props.row.original.general_asset?.symbol || props.row.original.asset?.symbol}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`font-mono uppercase text-2xs text-green-600 dark:text-green-500 ${props.row.original.amount_value > 1000000 ? 'font-semibold' : 'font-normal'}`}>
                      {currency_symbol}{numberFormat(props.row.original.amount_value, props.row.original.amount_value > 10000000 ? '0,0.00a' : props.row.original.amount_value > 1000 ? '0,0' : '0,0.00')}
                    </span>
                  </div>
                </div>
                :
                <div className="flex flex-col items-end space-y-2 my-1">
                  <div className="skeleton w-28 h-5" />
                  <div className="skeleton w-28 h-5" />
                </div>
            ),
            headerClassName: 'whitespace-nowrap justify-end text-right',
          },
          {
            Header: 'Volume',
            accessor: 'volume',
            sortType: (rowA, rowB) => rowA.original.volume_value > rowB.original.volume_value ? 1 : rowA.original.volume_value < rowB.original.volume_value ? -1 : rowA.original.volume > rowB.original.volume ? 1 : -1,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="flex flex-col items-end space-y-1.5 my-1">
                  <div className="flex items-center space-x-1.5">
                    <span className={`font-mono uppercase text-xs ${props.row.original.volume_value > 1000000 ? 'font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                      {numberFormat(props.value, props.value > 10000000 ? '0,0.00a' : props.value > 1000 ? '0,0' : '0,0.00')}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {props.row.original.general_asset?.symbol || props.row.original.asset?.symbol}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`font-mono uppercase text-2xs text-blue-600 dark:text-blue-500 ${props.row.original.volume_value > 1000000 ? 'font-semibold' : 'font-normal'}`}>
                      {currency_symbol}{numberFormat(props.row.original.volume_value, props.row.original.volume_value > 10000000 ? '0,0.00a' : props.row.original.volume_value > 1000 ? '0,0' : '0,0.00')}
                    </span>
                  </div>
                  <div className="flex flex-col items-end space-y-1 pt-1">
                    <span className="font-mono text-gray-700 dark:text-gray-300 text-3xs font-semibold">{props.row.original.proportion > -1 ? `${numberFormat(props.row.original.proportion * 100, `0,0.000${Math.abs(props.row.original.proportion * 100) < 0.001 ? '000' : ''}`)}%` : 'n/a'}</span>
                    <ProgressBar width={props.row.original.proportion > -1 ? props.row.original.proportion * 100 : 0} color="bg-yellow-500" className="h-1 ml-auto" />
                  </div>
                </div>
                :
                <div className="flex flex-col items-end space-y-2 my-1">
                  <div className="skeleton w-28 h-5" />
                  <div className="skeleton w-28 h-5" />
                  <div className="skeleton w-20 h-5" />
                </div>
            ),
            headerClassName: 'whitespace-nowrap justify-end text-right',
          },
        ]}
        data={chainsVolume ?
          chainsVolume.data?.map((ab, i) => { return { ...ab, i } }) || []
          :
          [...Array(10).keys()].map(i => { return { i, skeleton: true } })
        }
        noPagination={!chainsVolume || chainsVolume.data?.length <= 10 ? true : false}
        defaultPageSize={10}
        className={`min-h-full ${className}`}
      />
      {chainsVolume && !(chainsVolume.data?.length > 0) && (
        <div className="bg-white dark:bg-gray-900 rounded-xl text-gray-300 dark:text-gray-500 text-base font-medium italic text-center my-4 mx-2 py-2">
          No Chains Supported
        </div>
      )}
    </>
  )
}