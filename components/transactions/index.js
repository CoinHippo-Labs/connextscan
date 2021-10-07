import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

import moment from 'moment'
import { TiArrowRight } from 'react-icons/ti'
import { FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa'

import Datatable from '../datatable'
import Copy from '../copy'

import { transactions as getTransactions } from '../../lib/api/subgraph'
import { networks } from '../../lib/menus'
import { numberFormat, getName, ellipseAddress } from '../../lib/utils'

export default function Transactions({ className = '' }) {
  const router = useRouter()
  const { pathname, query } = { ...router }
  const { chain_id } = { ...query }
  const network = networks[networks.findIndex(network => network.id === chain_id)] || (pathname.startsWith('/[chain_id]') ? null : networks[0])

  const [transactions, setTransactions] = useState(null)

  useEffect(() => {
    const getData = async () => {
      if (network) {
        const response = await getTransactions({ chain_id: network.id })

        if (response) {
          setTransactions({ data: response.data || [], chain_id })
        }
      }
    }

    getData()

    const interval = setInterval(() => getData(), 15 * 1000)
    return () => clearInterval(interval)
  }, [network])

  return (
    <>
      <Datatable
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
                          {props.row.original.sendingChain?.explorer?.icon ?
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
                          {props.row.original.receivingChain?.explorer?.icon ?
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
            accessor: 'amount',
            disableSortBy: true,
            Cell: props => (
              !props.row.original.skeleton ?
                <>
                  <div className="text-right">
                    {props.value ?
                      <span className="flex items-center justify-end space-x-1">
                        <span>{numberFormat(props.value, '0,0.00000000')}</span>
                        <span className="uppercase font-medium">{props.row.original.symbol}</span>
                      </span>
                      :
                      props.row.original.activities && props.row.original.activities.findIndex(activity => activity.amount && activity.symbol) > -1 ?
                        props.row.original.activities.map((activity, i) => (
                          <div key={i} className="flex items-center justify-end space-x-1">
                            <span>{numberFormat(activity.amount, '0,0.00000000')}</span>
                            <span className="uppercase font-medium">{ellipseAddress(activity.symbol || activity.denom, 6)}</span>
                          </div>
                        ))
                        :
                        <span className="text-gray-400 dark:text-gray-600 font-light">-</span>
                    }
                  </div>
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
          (transactions?.data || []).map((transaction, i) => { return { ...transaction, i } })
          :
          [...Array(10).keys()].map(i => { return { i, skeleton: true } })
        }
        noPagination={!transactions || transactions?.data?.length <= 10 ? true : false}
        defaultPageSize={10}
        className={`min-h-full ${className}`}
      />
      {transactions && !(transactions.data?.length > 0) && (
        <div className="bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-500 text-base font-medium italic text-center my-4 py-2">
          No Transactions
        </div>
      )}
    </>
  )
}