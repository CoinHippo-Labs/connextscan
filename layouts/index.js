import { useRouter } from 'next/router'

import Empty from './empty'
import Centered from './centered'
import Layout from './layout'

export default function Layouts({ children }) {
  const router = useRouter()
  const { pathname, query } = { ...router }

  return (
    <Layout>
      {children}
      <div className="dark:bg-black" />
      <div className="bg-indigo-300" />
      <div className="bg-yellow-400" />
      <div className="bg-blue-600" />
      <div className="bg-red-600" />
      <div className="bg-indigo-400" />
      <div className="bg-gray-500" />
      <div className="bg-indigo-600" />
      <div className="bg-green-500" />
      <div className="bg-pink-500" />
      <div className="dark:bg-green-600" />
      <div className="dark:bg-red-700" />
      <div className="dark:bg-indigo-500" />
    </Layout>
  )
}