import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { Img } from 'react-image'
import StackGrid from 'react-stack-grid'
import { MdOutlineRouter } from 'react-icons/md'
import { TiArrowRight } from 'react-icons/ti'

import Copy from '../../copy'
import Widget from '../../widget'

import { currency_symbol } from '../../../lib/object/currency'
import { networks } from '../../../lib/menus'
import { numberFormat, ellipseAddress } from '../../../lib/utils'

export default function Bridges() {
	const { contracts, assets } = useSelector(state => ({ contracts: state.contracts, assets: state.assets }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }

  const [bridges, setBridges] = useState(null)

  useEffect(() => {
    if (assets_data) {
      const data = _.orderBy(Object.entries(
        _.groupBy(Object.values(assets_data).flatMap(asset_data => asset_data.map(asset => {
          return {
            ...asset,
            data: contracts_data?.find(contract => contract.id === asset.contract_address)?.data,
          }
        }).map(asset => {
          return {
            ...asset,
            normalize_amount: asset?.data?.contract_decimals && (asset.amount / Math.pow(10, asset.data.contract_decimals)),
          }
        }).map(asset => {
          return {
            ...asset,
            value: typeof asset?.normalize_amount === 'number' && typeof asset?.data?.prices?.[0].price === 'number' && (asset?.normalize_amount * asset?.data?.prices?.[0].price),
          }
        })), 'router.id')
      ).map(([key, value]) => {
        return {
          router_id: key,
          assets: _.groupBy(_.orderBy(value, ['value'], ['desc']), 'chain_data.id'),
         }
      }).map(assets => {
        return {
          ...assets,
          liquidity: assets &&_.sumBy(Object.values(assets.assets), 'value'),
        }
      }), ['liquidity'], ['desc'])

      setBridges(data)
    }
  }, [contracts_data, assets_data])

  const bridgesComponent = bridges?.map((bridge, i) => (
    <Widget
      key={i} 
      title={<div className="flex items-center text-gray-900 dark:text-gray-100 font-medium space-x-1">
        <MdOutlineRouter size={20} className="mb-0.5" />
        <span>Router</span>
      </div>}
      right={<Copy
        text={bridge?.router_id}
        copyTitle={<span className="text-gray-400 dark:text-gray-200 text-xs font-medium">
          {ellipseAddress(bridge?.router_id, 6)}
        </span>}
      />}
    >
      <div className="grid grid grid-flow-row grid-cols-2 sm:grid-cols-3 gap-0.5 mt-3 mb-2">
        {bridge?.assets && Object.values(bridge.assets).flatMap(assets => assets).map((asset, j) => (
          <div key={j}>
            {asset?.data ?
              <div className={`${asset?.chain_data?.color?.background} bg-opacity-90 rounded text-white p-3`}>
                <div className="space-y-0.5">
                  {asset?.data && (
                    <div className="flex">
                      {asset.data.logo_url && (
                        <Img
                          src={asset.data.logo_url}
                          alt=""
                          className="w-5 h-5 rounded-full mr-1"
                        />
                      )}
                      <div>
                        <div className="text-xs font-bold">{asset.data.contract_name}</div>
                        {/*<div className="font-normal" style={{ fontSize: '.65rem' }}>{asset.data.contract_ticker_symbol}</div>*/}
                        {asset?.id && (
                          <div className="min-w-max flex items-center space-x-1">
                            <Copy
                              size={14}
                              text={asset.id.replace(`-${bridge.router_id}`, '')}
                              copyTitle={<span className="text-white font-medium" style={{ fontSize: '.65rem' }}>
                                {ellipseAddress(asset.id.replace(`-${bridge.router_id}`, ''), 6)}
                              </span>}
                              className="text-white"
                            />
                            {asset?.chain_data?.explorer?.url && (
                              <a
                                href={`${asset.chain_data.explorer.url}${asset.chain_data.explorer.contract_path?.replace('{address}', asset.id.replace(`-${bridge.router_id}`, ''))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white"
                              >
                                {asset.chain_data.explorer.icon ?
                                  <img
                                    src={asset.chain_data.explorer.icon}
                                    alt=""
                                    className="w-4 h-4 rounded-full"
                                  />
                                  :
                                  <TiArrowRight size={16} className="transform -rotate-45" />
                                }
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      {asset?.chain_data?.icon && (
                        <Link href={`/${asset.chain_data.id}`}>
                          <a
                            className="bg-white ring w-5 h-5 rounded relative ml-auto"
                            style={{ top: '-.25rem', right: '-.3rem' }}
                          >
                            <img
                              src={asset.chain_data.icon}
                              alt=""
                              className="w-5 h-5"
                            />
                          </a>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-center my-3">
                  {/*<div className="uppercase text-gray-100" style={{ fontSize: '.65rem' }}>Liquidity</div>*/}
                  <div>
                    <span className="font-mono text-black text-base font-semibold mr-1.5">{asset?.normalize_amount ? numberFormat(asset.normalize_amount, '0,0') : asset?.amount && !(asset?.data) ? numberFormat(asset.amount / Math.pow(10, asset?.chain_data?.currency?.decimals), '0,0') : '-'}</span>
                    <span className="text-black text-sm">{asset?.data?.contract_ticker_symbol}</span>
                  </div>
                  <div className="text-gray-800 text-sm font-medium mt-1">~{currency_symbol}{typeof asset?.value === 'number' ? numberFormat(asset.value, '0,0') : ' -'}</div>
                </div>
              </div>
              :
              <div className="skeleton w-full h-36" />
            }
          </div>
        ))}
      </div>
    </Widget>
  ))

  return (
    <>
      <StackGrid
        columnWidth={620}
        gutterWidth={12}
        gutterHeight={12}
        className="hidden sm:block"
      >
        {bridgesComponent}
      </StackGrid>
      <div className="block sm:hidden space-y-3">
        {bridgesComponent}
      </div>
      <div className="bg-indigo-300" />
      <div className="bg-yellow-400" />
      <div className="bg-blue-600" />
      <div className="bg-red-600" />
      <div className="bg-indigo-400" />
      <div className="bg-gray-500" />
      <div className="bg-indigo-600" />
      <div className="bg-green-500" />
      <div className="bg-pink-500" />
    </>
  )
}