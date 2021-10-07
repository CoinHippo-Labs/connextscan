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
          setTransactions({ data: response.data || [] })
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
                  {(props.row.original.fulfillTransactionHash || props.row.original.prepareTransactionHash || props.row.original.cancelTransactionHash) && network?.explorer?.url && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Copy
                        size={12}
                        text={(props.row.original.fulfillTransactionHash || props.row.original.prepareTransactionHash || props.row.original.cancelTransactionHash)}
                        copyTitle={<span className="text-xs text-gray-400 dark:text-gray-600 font-light">
                          {ellipseAddress((props.row.original.fulfillTransactionHash || props.row.original.prepareTransactionHash || props.row.original.cancelTransactionHash), 6)}
                        </span>}
                      />
                      <a
                        href={`${network.explorer.url}${network.explorer.transaction_path?.replace('{tx}', (props.row.original.fulfillTransactionHash || props.row.original.prepareTransactionHash || props.row.original.cancelTransactionHash))}`}
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
                <div className={`max-w-min bg-gray-100 dark:bg-${props.value === 'success' ? 'green-600' : props.value === 'pending' ? 'indigo-300' : 'red-700'} rounded-lg flex items-center space-x-1 py-1 px-1.5`}>
                  {props.value === 'success' ?
                    <FaCheckCircle size={14} className="text-green-500 dark:text-white" />
                    :
                    props.value === 'pending' ?
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
            Header: 'From',
            accessor: 'user.id',
            disableSortBy: true,
            Cell: props => (
              !props.row.original.skeleton ?
                <Link href={`/blocks/${props.value}`}>
                  <a className="text-blue-600 dark:text-blue-400">
                    {props.value}
                  </a>
                </Link>
                :
                <div className="skeleton w-16 h-4" />
            ),
          },
          {
            Header: 'To',
            accessor: 'receivingChainTxManagerAddress',
            disableSortBy: true,
            Cell: props => (
              !props.row.original.skeleton ?
                props.value ?
                  <span className="bg-gray-100 dark:bg-gray-800 rounded capitalize text-gray-900 dark:text-gray-100 font-semibold px-2 py-1">
                    {getName(props.value)}
                  </span>
                  :
                  '-'
                :
                <div className="skeleton w-12 h-4" />
            ),
          },
          {
            Header: 'Amount',
            accessor: 'amount',
            disableSortBy: true,
            Cell: props => (
              !props.row.original.skeleton ?
                <div className="text-right">
                  {typeof props.value === 'number' ?
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
                      '-'
                  }
                </div>
                :
                <div className="skeleton w-16 h-4 ml-auto" />
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
        data={transactions ?
          transactions.data && transactions.data.map((transaction, i) => { return { ...transaction, i } })
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