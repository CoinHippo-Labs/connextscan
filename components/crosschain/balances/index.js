import { useRouter } from 'next/router'

import { Img } from 'react-image'
import { TiArrowRight } from 'react-icons/ti'

import Datatable from '../../datatable'
import Copy from '../../copy'

import { networks } from '../../../lib/menus'
import { currency_symbol } from '../../../lib/object/currency'
import { numberFormat, ellipseAddress } from '../../../lib/utils'

export default function Balances({ data, className = '' }) {
  const router = useRouter()
  const { query } = { ...router }
  const { address } = { ...query }

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
            accessor: 'contract_name',
            Cell: props => (
              !props.row.original.skeleton ?
                props.row.original.contract_address ?
                  <>
                    <div className="flex items-center space-x-1.5">
                      {props.row.original.logo_url && (
                        <Img
                          src={props.row.original.logo_url}
                          alt=""
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <span className="font-semibold">{props.value}</span>
                      {props.row.original.contract_ticker_symbol && (
                        <span className="text-gray-600 dark:text-gray-400 text-2xs">{props.row.original.contract_ticker_symbol}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <Copy
                        text={props.row.original.contract_address}
                        copyTitle={<span className="text-gray-400 dark:text-gray-200 text-xs font-medium">
                          {ellipseAddress(props.row.original.contract_address, 6)}
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
                              className="w-4 h-4 rounded-full opacity-50"
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
            Header: 'Balance',
            accessor: 'balance',
            sortType: (rowA, rowB) => rowA.original.balance / Math.pow(10, rowA.original.contract_decimals) > rowB.original.balance / Math.pow(10, rowB.original.contract_decimals) ? 1 : -1,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="text-right space-x-1 mr-4">
                  <span className="font-mono font-semibold">
                    {numberFormat(props.value / Math.pow(10, props.row.original.contract_decimals), '0,0.00000000')}
                  </span>
                  {props.row.original.contract_ticker_symbol && (
                    <span className="text-gray-600 dark:text-gray-400 text-xs">{props.row.original.contract_ticker_symbol}</span>
                  )}
                </div>
                :
                <div className="skeleton w-16 h-4 ml-auto mr-4" />
            ),
            headerClassName: 'justify-end text-right mr-4',
          },
          {
            Header: 'Chain',
            accessor: 'chain_data.short_name',
            Cell: props => (
              !props.row.original.skeleton ?
                props.value ?
                  <div className="flex items-start space-x-1.5">
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
                  </div>
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
            Header: 'Price',
            accessor: 'quote_rate',
            sortType: (rowA, rowB) => rowA.original.quote_rate > rowB.original.quote_rate ? 1 : -1,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="text-gray-700 dark:text-gray-300 font-medium text-right space-x-1 mr-4">
                  {currency_symbol}
                  {props.value > -1 ?
                    numberFormat(props.value, '0,0.000000')
                    :
                    <span>-</span>
                  }
                </div>
                :
                <div className="skeleton w-16 h-4 ml-auto mr-4" />
            ),
            headerClassName: 'justify-end text-right mr-4',
          },
          {
            Header: 'Value',
            accessor: 'quote',
            sortType: (rowA, rowB) => rowA.original.quote > rowB.original.quote ? 1 : -1,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="font-semibold text-right space-x-1">
                  {currency_symbol}
                  {numberFormat(props.value, '0,0.000000')}
                </div>
                :
                <div className="skeleton w-16 h-4 ml-auto" />
            ),
            headerClassName: 'justify-end text-right',
          },
        ]}
        data={(data?.address === address ?
          (data?.data || []).map((balance, i) => { return { ...balance, i } })
          :
          [...Array(5).keys()].map(i => { return { i, skeleton: true } })
        )}
        noPagination={!data || data.address !== address || data.data?.length <= 10 ? true : false}
        defaultPageSize={10}
        className={`min-h-full ${className}`}
      />
      {data && data.address === address && !(data.data?.length > 0) && (
        <div className="bg-white dark:bg-gray-900 border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-700 text-gray-300 dark:text-gray-700 text-base font-medium italic text-center mt-3 py-16">
          No Balances
        </div>
      )}
    </>
  )
}