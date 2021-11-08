import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { Img } from 'react-image'
import { MdOutlineRouter } from 'react-icons/md'
import { TiArrowRight } from 'react-icons/ti'
import { IoCaretUpOutline, IoCaretDownOutline } from 'react-icons/io5'

import Datatable from '../../datatable'
import Copy from '../../copy'
import { ProgressBar } from '../../progress-bars'

import { networks } from '../../../lib/menus'
import { currency, currency_symbol } from '../../../lib/object/currency'
import { numberFormat, ellipseAddress } from '../../../lib/utils'

const SYMBOL_LOOKUP = {
  weth: 'ETH',
  xdai: 'DAI',
  oai: 'OMN',
}

const COLLAPSE_CHAINS_SIZE = 3

export default function TopLiquidity({ n, isAggs = true, className = '' }) {
  const { contracts, assets, ens } = useSelector(state => ({ contracts: state.contracts, assets: state.assets, ens: state.ens }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }
  const { ens_data } = { ...ens }

  const [assetBalances, setAssetBalances] = useState(null)
  const [symbolsSeeMore, setSymbolsSeeMore] = useState([])

  useEffect(() => {
    if (assets_data && contracts_data) {
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

      if (isAggs && data) {
        data = _.orderBy(Object.entries(_.groupBy(data.map(asset => {
          return {
            ...asset,
            _symbol: asset?.data?.contract_ticker_symbol?.substring(0, asset.data.contract_ticker_symbol.includes('.') ? asset.data.contract_ticker_symbol.indexOf('.') : asset.data.contract_ticker_symbol.length).split('').filter(c => c === c.toUpperCase()).join(''),
          }
        }).map(asset => {
          return {
            ...asset,
            _symbol: SYMBOL_LOOKUP[asset._symbol?.toLowerCase()] || asset._symbol,
          }
        }), '_symbol')).map(([key, value]) => {
          const contract_name = value ? _.orderBy(value, ['value'], ['desc']).map(_contract => _contract?.data?.contract_name).filter(name => name) : []
          const logo_url = value ? _.orderBy(value, ['value'], ['desc']).flatMap(_contract => _contract?.data?.logo_url).filter(url => url) : []

          return {
            ..._.maxBy(value, ['value']),
            normalize_amount: _.sumBy(value, 'normalize_amount'),
            value: _.sumBy(value, 'value'),
            data: {
              ...(_.maxBy(value, ['value'])?.data),
              contract_ticker_symbol: key,
              contract_name: _.head(_.uniqBy(/*_.orderBy(*/contract_name.map(_name => { return { name: _name, count: contract_name.filter(__name => __name === _name).length } }) || []/*, ['count'], ['desc'])*/, 'name').map(_name => _name.name)),
              logo_url: _.uniqBy(_.orderBy(logo_url.map(_logo_url => { return { url: _logo_url, count: logo_url.filter(__logo_url => __logo_url === _logo_url).length } }) || [], ['count'], ['desc']), 'url').map(_logo_url => _logo_url.url),
            },
            assets: _.groupBy(value, 'chain_data.id'),
          }
        }), ['value'], ['desc'])
      }

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
                  <div className={`mb-${isAggs ? 2 : 0} mr-2 lg:mr-0`}>
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
                    {!isAggs && (
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
                    )}
                  </div>
                  :
                  <span className="text-gray-400 dark:text-gray-600 font-light">Unknown</span>
                :
                <>
                  <div className="skeleton w-32 h-4" />
                  {!isAggs && (
                    <div className="skeleton w-24 h-3 mt-3" />
                  )}
                </>
            ),
          },
          {
            Header: 'Max Transfer Size',
            accessor: 'assets',
            disableSortBy: true,
            Cell: props => (
              !props.row.original.skeleton && props.row.original.data ?
                <div className="space-y-1.5 mr-4">
                  {_.slice(_.orderBy(Object.entries(props.value).filter(([key, value]) => value?.length > 0), _entry => -1 * _.maxBy(_entry[1], 'normalize_amount')?.normalize_amount), 0, symbolsSeeMore.includes(props.row.original._symbol) ? Object.entries(props.value).filter(([key, value]) => value?.length > 0).length : COLLAPSE_CHAINS_SIZE).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-end space-x-2">
                      <span className="font-mono font-semibold">
                        {numberFormat(_.maxBy(value, 'normalize_amount')?.normalize_amount, '0,0')}
                      </span>
                      {_.maxBy(value, 'normalize_amount')?.data?.contract_ticker_symbol && (
                        <span className="text-gray-600 dark:text-gray-400 text-xs">{_.maxBy(value, 'normalize_amount').data.contract_ticker_symbol}</span>
                      )}
                      {_.maxBy(value, 'normalize_amount')?.chain_data?.icon && (
                        <img
                          src={_.maxBy(value, 'normalize_amount').chain_data.icon}
                          alt=""
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                    </div>
                  ))}
                  {(Object.entries(props.value).filter(([key, value]) => value?.length > 0).length > COLLAPSE_CHAINS_SIZE || symbolsSeeMore.includes(props.row.original._symbol)) && (
                    <div
                      onClick={() => setSymbolsSeeMore(symbolsSeeMore.includes(props.row.original._symbol) ? symbolsSeeMore.filter(_symbol => _symbol !== props.row.original._symbol) : _.uniq(_.concat(symbolsSeeMore, props.row.original._symbol)))}
                      className={`max-w-min flex items-center cursor-pointer rounded capitalize text-${symbolsSeeMore.includes(props.row.original._symbol) ? 'red-500' : 'gray-500 dark:text-white'} text-xs font-medium space-x-0.5 ml-auto`}
                    >
                      <span>See {symbolsSeeMore.includes(props.row.original._symbol) ? 'Less' : 'More'}</span>
                      {!(symbolsSeeMore.includes(props.row.original._symbol)) && (
                        <span>({numberFormat(Object.entries(props.value).filter(([key, value]) => value?.length > 0).length - COLLAPSE_CHAINS_SIZE, '0,0')})</span>
                      )}
                      {symbolsSeeMore.includes(props.row.original._symbol) ? <IoCaretUpOutline /> : <IoCaretDownOutline />}
                    </div>
                  )}
                </div>
                :
                <div className="space-y-1.5 mr-4">
                  {[...Array(networks.filter(network => network?.id && !(network?.disabled)).length).keys()].map(i => (
                    <div key={i} className="skeleton w-28 h-4 ml-auto" />
                  ))}
                </div>
            ),
            headerClassName: 'justify-end text-right mr-4',
          },
          {
            Header: 'Total Liquidity',
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
                <div className="skeleton w-28 h-4 ml-auto mr-4" />
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
                  <div className={`flex items-${ens_data?.[props.value.toLowerCase()]?.name ? 'start' : 'center'} space-x-1`}>
                    <MdOutlineRouter size={20} className="text-gray-400 dark:text-gray-500 mb-0.5" />
                    <div className="space-y-1">
                      {ens_data?.[props.value.toLowerCase()]?.name && (
                        <Link href={`/router/${props.value}`}>
                          <a className="text-gray-900 dark:text-white font-semibold">
                            {ens_data[props.value.toLowerCase()].name}
                          </a>
                        </Link>
                      )}
                      <div className="flex items-center space-x-1">
                        {ens_data?.[props.value.toLowerCase()]?.name ?
                          <Copy
                            text={props.value}
                            copyTitle={<span className="text-gray-400 dark:text-gray-500 text-xs font-normal">
                              {ellipseAddress(props.value, 10)}
                            </span>}
                          />
                          :
                          <>
                            <Link href={`/router/${props.value}`}>
                              <a className="text-indigo-600 dark:text-white text-xs font-medium">
                                {ellipseAddress(props.value, 10)}
                              </a>
                            </Link>
                            <Copy text={props.value} />
                          </>
                        }
                      </div>
                    </div>
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
            headerClassName: 'whitespace-nowrap justify-end text-right mr-4',
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
        ].filter(column => !isAggs ? !(['assets'].includes(column.accessor)) : !(['chain_data.short_name', 'router.id'].includes(column.accessor)))}
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