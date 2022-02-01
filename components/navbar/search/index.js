import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { useForm } from 'react-hook-form'
import { FiSearch } from 'react-icons/fi'

import { type } from '../../../lib/object/id'

export default function Search() {
  const { ens, asset_balances } = useSelector(state => ({ ens: state.ens, asset_balances: state.asset_balances }), shallowEqual)
  const { ens_data } = { ...ens }
  const { asset_balances_data } = { ...asset_balances }

  const router = useRouter()

  const [inputSearch, setInputSearch] = useState('')
  const [routerIds, setRouterIds] = useState(null)

  const inputSearchRef = useRef()

  const { handleSubmit } = useForm()

  useEffect(() => {
    if (asset_balances_data) {
      setRouterIds(_.uniq(Object.values(asset_balances_data).flatMap(abs => abs?.map(ab => ab?.router?.id).filter(id => id) || [])))
    }
  }, [asset_balances_data])

  const onSubmit = () => {
    let _inputSearch = inputSearch, searchType = type(_inputSearch)

    if (searchType) {
      if (searchType === 'address' && routerIds?.includes(_inputSearch?.toLowerCase())) {
        searchType = 'router'
      }
      else if (Object.entries(ens_data || {}).findIndex(([key, value]) => value?.name?.toLowerCase() === _inputSearch?.toLowerCase()) > -1) {
        _inputSearch = Object.entries(ens_data).find(([key, value]) => value?.name?.toLowerCase() === _inputSearch?.toLowerCase())[0]
        searchType = routerIds?.includes(_inputSearch?.toLowerCase()) ? 'router' : 'address'
      }

      router.push(`/${searchType}/${_inputSearch}${['tx'].includes(searchType) ? '?source=search' : ''}`)

      setInputSearch('')

      inputSearchRef?.current?.blur()
    }
  }

  return (
    <div className="navbar-search mr-1.5 sm:mx-3">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="relative">
          <input
            ref={inputSearchRef}
            value={inputSearch}
            onChange={event => setInputSearch(event.target.value?.trim())}
            type="search"
            placeholder="Search by Tx ID / Router / Address"
            className="w-48 sm:w-72 xl:w-80 h-8 sm:h-10 appearance-none rounded-lg text-xs pl-2 sm:pl-8 pr-0 sm:pr-3 focus:outline-none"
         />
          <div className="hidden sm:block absolute top-0 left-0 mt-3 ml-2.5">
            <FiSearch size={14} className="stroke-current" />
          </div>
        </div>
      </form>
    </div>
  )
}