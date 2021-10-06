import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import moment from 'moment'

// import Summary from './summary'
// import BlocksTable from '../blocks/blocks-table'
// import TransactionsTable from '../transactions/transactions-table'
import Widget from '../widget'

// import { status as getStatus, consensusState } from '../../lib/api/rpc'
// import { allValidators } from '../../lib/api/cosmos'
import { numberFormat } from '../../lib/utils'

import { STATUS_DATA } from '../../reducers/types'

export default function Dashboard() {
  const dispatch = useDispatch()
  const { data } = useSelector(state => ({ data: state.data }), shallowEqual)
  const { chain_data, status_data } = { ...data }

  const [summaryData, setSummaryData] = useState(null)
  const [consensusStateData, setConsensusStateData] = useState(null)

  // useEffect(() => {
  //   const getData = async () => {
  //     const response = await getStatus()

  //     if (response) {
  //       dispatch({
  //         type: STATUS_DATA,
  //         value: response
  //       })
  //     }
  //   }

  //   getData()

  //   const interval = setInterval(() => getData(), 5 * 1000)
  //   return () => clearInterval(interval)
  // }, [])

  // useEffect(() => {
  //   const getConsensusState = async () => {
  //     const response = await consensusState()

  //     if (response) {
  //       setConsensusStateData(response)
  //     }
  //   }

  //   getConsensusState()

  //   const interval = setInterval(() => getConsensusState(), 5 * 1000)
  //   return () => clearInterval(interval)
  // }, [])

  // useEffect(() => {
  //   const getData = async () => {
  //     if (consensusStateData && consensusStateData.validators && consensusStateData.validators.proposer && consensusStateData.validators.proposer.address) {
  //       const validator_data = validators_data && validators_data[validators_data.findIndex(validator_data => validator_data.consensus_address === hexToBech32(consensusStateData.validators.proposer.address, process.env.NEXT_PUBLIC_PREFIX_CONSENSUS))]

  //       if (validator_data) {
  //         consensusStateData.operator_address = validator_data.operator_address
          
  //         if (validator_data.description) {
  //           consensusStateData.proposer_name = validator_data.description.moniker
  //           consensusStateData.proposer_image = validator_data.description.image
  //         }
  //       }

  //       consensusStateData.voting_power = consensusStateData.validators.proposer.voting_power

  //       if (chain_data && chain_data.staking_pool) {
  //         consensusStateData.voting_power_percentage = consensusStateData.voting_power * 100 / Math.floor(chain_data.staking_pool.bonded_tokens)
  //       }
  //     }

  //     setSummaryData({ data: {
  //       latest_block: { ...consensusStateData },
  //       block_height: status_data && Number(status_data.latest_block_height),
  //       block_height_at: status_data && moment(status_data.latest_block_time).valueOf(),
  //       avg_block_time: status_data && moment(status_data.latest_block_time).diff(moment(status_data.earliest_block_time), 'seconds') / Number(status_data.latest_block_height),
  //       active_validators: validators_data && validators_data.filter(validator_data => ['BOND_STATUS_BONDED'].includes(validator_data.status)).length,
  //       total_validators: validators_data && validators_data.length,
  //       denom: chain_data && chain_data.staking_params && denomName(chain_data.staking_params.bond_denom),
  //       online_voting_power_now: chain_data && chain_data.staking_pool && numberFormat(Math.floor(chain_data.staking_pool.bonded_tokens), '0,0.00a'),
  //       online_voting_power_now_percentage: chain_data && chain_data.staking_pool && chain_data.bank_supply && (Math.floor(chain_data.staking_pool.bonded_tokens) * 100 / chain_data.bank_supply.amount),
  //       total_voting_power: chain_data && chain_data.bank_supply && numberFormat(chain_data.bank_supply.amount, '0,0.00a'),
  //     }})
  //   }

  //   getData()
  // }, [chain_data, status_data, validators_data, consensusStateData])

  return (
    <div className="my-4 mx-auto pb-2">
      {/*<Summary data={summaryData && summaryData.data} />
      <div className="w-full grid grid-flow-row grid-cols-1 lg:grid-cols-2 gap-5 my-4">
        <div className="mt-3">
          <Link href="/blocks">
            <a className="text-gray-900 dark:text-gray-100 text-base font-semibold mx-3">Latest Blocks</a>
          </Link>
          <div className="h-1" />
          <Widget className="min-h-full contents p-0">
            <BlocksTable n={10} className="bg-white dark:bg-gray-900" />
          </Widget>
        </div>
        <div className="mt-8 md:mt-3">
          <Link href="/transactions">
            <a className="text-gray-900 dark:text-gray-100 text-base font-semibold mx-3">Latest Transactions</a>
          </Link>
          <div className="h-1" />
          <Widget className="min-h-full contents p-0">
            <TransactionsTable page="index" className="bg-white dark:bg-gray-900" />
          </Widget>
        </div>
      </div>*/}
    </div>
  )
}