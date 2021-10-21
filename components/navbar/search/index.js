import { useRouter } from 'next/router'
import { useState, useRef } from 'react'

import { useForm } from 'react-hook-form'
import { FiSearch } from 'react-icons/fi'

import { networks } from '../../../lib/menus'
import { type } from '../../../lib/object/id'

export default function Search() {
  const router = useRouter()

  const [inputSearch, setInputSearch] = useState('')

  const inputSearchRef = useRef()

  const { handleSubmit } = useForm()

  const onSubmit = () => {
    if (type(inputSearch)) {
      router.push(`/${type(inputSearch)}/${inputSearch}`)

      setInputSearch('')

      inputSearchRef?.current?.blur()
    }
  }

  return (
    <div className="navbar-search mr-1.5 sm:mx-3 xl:mr-16">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="relative">
          <input
            ref={inputSearchRef}
            value={inputSearch}
            onChange={event => setInputSearch(event.target.value)}
            type="search"
            placeholder="Search by Address / TX ID"
            className="w-60 sm:w-72 xl:w-96 h-8 sm:h-10 appearance-none rounded text-xs pl-2 sm:pl-8 pr-0 sm:pr-3 focus:outline-none"
          />
          <div className="hidden sm:block absolute top-0 left-0 mt-3 ml-2.5">
            <FiSearch size={14} className="stroke-current" />
          </div>
        </div>
      </form>
    </div>
  )
}