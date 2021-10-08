export const navigations = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/',
  },
  {
    id: 'pools',
    title: 'Pools',
    path: '/pools',
  },
  {
    id: 'txs',
    title: 'Transactions',
    path: '/txs',
  },
]

export const networks = [
  {
    id: '',
    title: 'Connext',
    short_name: 'CONNEXT',
    info_url: 'https://connext.network',
    currency: {
      name: 'Connext',
      symbol: 'CONNEXT',
      decimals: 18,
      coingecko_id: 'connext',
    },
  },
  {
    id: 'eth',
    title: 'Ethereum',
    short_name: 'ETH',
    network_id: 1,
    info_url: 'https://ethereum.org',
    currency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
      coingecko_id: 'ethereum',
    },
    explorer: {
      name: 'Etherscan',
      url: 'https://etherscan.io',
      icon: '/logos/explorers/etherscan.png',
      block_path: '/block/{block}',
      address_path: '/address/{address}',
      contract_path: '/token/{address}',
      transaction_path: '/tx/{tx}',
    },
    gas: {
      url: 'https://www.gasnow.org/api/v3/gas/price',
      decimals: 9,
    },
    disabled: true,
  },
  {
    id: 'bsc',
    title: 'Binance Smart Chain',
    short_name: 'BSC',
    network_id: 56,
    info_url: 'https://www.binance.org',
    currency: {
      name: 'Binance Chain Native Token',
      symbol: 'BNB',
      decimals: 18,
      coingecko_id: 'binancecoin',
    },
    explorer: {
      name: 'BscScan',
      url: 'https://bscscan.com',
      icon: '/logos/explorers/bscscan.png',
      block_path: '/block/{block}',
      address_path: '/address/{address}',
      contract_path: '/token/{address}',
      transaction_path: '/tx/{tx}',
    },
  },
  {
    id: 'matic',
    title: 'Polygon',
    short_name: 'MATIC',
    network_id: 137,
    info_url: 'https://polygon.technology',
    currency: {
      name: 'Matic',
      symbol: 'MATIC',
      decimals: 18,
      coingecko_id: 'matic-network',
    },
    explorer: {
      name: 'PolygonScan',
      url: 'https://polygonscan.com',
    icon: '/logos/explorers/polygonscan.png',
        block_path: '/block/{block}',
      address_path: '/address/{address}',
      contract_path: '/token/{address}',
      transaction_path: '/tx/{tx}',
    },
    gas: {
      url: 'https://gasstation-mainnet.matic.network',
      decimals: 0,
    },
  },
  {
    id: 'avax',
    title: 'Avalanche',
    short_name: 'AVAX',
    network_id: 43114,
    info_url: 'https://www.avax.network',
    currency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
      coingecko_id: 'avalanche-2',
    },
    explorer: {
      name: 'AVASCAN',
      url: 'https://avascan.info/blockchain/c',
      icon: '/logos/explorers/avascan.png',
      block_path: '/block/{block}',
      address_path: '/address/{address}',
      contract_path: '/token/{address}',
      transaction_path: '/tx/{tx}',
    },
  },
  {
    id: 'arb',
    title: 'Arbitrum',
    short_name: 'ARB',
    network_id: 42161,
    info_url: 'https://bridge.arbitrum.io/',
    currency: {
      name: 'Arbitrum Ether',
      symbol: 'tETH',
      decimals: 18,
      coingecko_id: 'ethereum',
    },
    explorer: {
      name: 'ARBISCAN',
      url: 'https://arbiscan.io',
      icon: '/logos/explorers/arbiscan.png',
      block_path: '/block/{block}',
      address_path: '/address/{address}',
      contract_path: '/token/{address}',
      transaction_path: '/tx/{tx}',
    },
  },
  {
    id: 'xdai',
    title: 'xDAI Chain',
    short_name: 'xDAI',
    network_id: 100,
    info_url: 'https://forum.poa.network/c/xdai-chain',
    currency: {
      name: 'xDAI',
      symbol: 'xDAI',
      decimals: 18,
      coingecko_id: 'xdai',
    },
    explorer: {
      name: 'BlockScout',
      url: 'https://blockscout.com/xdai/mainnet',
      icon: '/logos/explorers/blockscout.png',
      block_path: '/block/{block}',
      address_path: '/address/{address}',
      contract_path: '/token/{address}',
      transaction_path: '/tx/{tx}',
    },
  },
  {
    id: 'ftm',
    title: 'Fantom',
    short_name: 'FTM',
    network_id: 250,
    info_url: 'https://fantom.foundation',
    currency: {
      name: 'Fantom',
      symbol: 'FTM',
      decimals: 18,
      coingecko_id: 'fantom',
    },
    explorer: {
      name: 'FTMScan',
      url: 'https://ftmscan.com',
      icon: '/logos/explorers/ftmscan.png',
      block_path: '/block/{block}',
      address_path: '/address/{address}',
      contract_path: '/token/{address}',
      transaction_path: '/tx/{tx}',
    },
  },
  {
    id: 'heco',
    title: 'Huobi ECO Chain',
    short_name: 'Heco',
    network_id: 128,
    info_url: 'https://www.hecochain.com',
    currency: {
      name: 'Huobi ECO Chain Native Token',
      symbol: 'HT',
      decimals: 18,
      coingecko_id: 'huobi-token',
    },
    explorer: {
      name: 'HecoInfo',
      url: 'https://hecoinfo.com',
      icon: '/logos/explorers/hecoinfo.png',
      block_path: '/block/{block}',
      address_path: '/address/{address}',
      contract_path: '/token/{address}',
      transaction_path: '/tx/{tx}',
    },
    disabled: true,
  },
  {
    id: 'mbase',
    title: 'Moonbase Alpha',
    short_name: 'MBase',
    network_id: 1287,
    info_url: 'https://moonbeam.network',
    currency: {
      name: 'Dev',
      symbol: 'DEV',
      decimals: 18,
      coingecko_id: 'moonbeam',
    },
    explorer: {
      name: 'SUBSCAN',
      url: 'https://moonbase.subscan.io',
      icon: '/logos/explorers/subscan.png',
      block_path: '/block/{block}',
      address_path: '/account/{address}',
      contract_path: '/account/{address}',
      transaction_path: '/extrinsic/{tx}',
    },
    disabled: true,
  },
].map(network => { return { ...network, url: `/${network.id || ''}`, icon: `/logos/chains/${network.id || 'connext'}.png`, name: network.name || network.short_name } })