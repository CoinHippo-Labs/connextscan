export const chainTitle = data => data?.title && data.title.split(' ').length < 3 ? data.title : data?.short_name

export const connext = {
	id: '',
	title: 'Connext',
	short_name: 'NXTP',
  image: '/logos/logo.png',
  explorer: null,
  menu_hidden: true,
}

export const chainExtraData = chain_id => {
	let data

	switch (chain_id) {
		case 1:
			data = {
				...data,
				info_url: data?.info_url || 'https://ethereum.org',
			}
		case 42161:
			data = {
				...data,
				info_url: data?.info_url || 'https://bridge.arbitrum.io/',
			}
		case 10:
			data = {
				...data,
				info_url: data?.info_url || 'https://www.optimism.io/',
			}
		case 3:
			data = {
				...data,
				info_url: data?.info_url || 'https://ethereum.org',
			}
		case 4:
			data = {
				...data,
				info_url: data?.info_url || 'https://www.rinkeby.io',
			}
		case 5:
			data = {
				...data,
				info_url: data?.info_url || 'https://goerli.net',
			}
		case 42:
			data = {
				...data,
				info_url: data?.info_url || 'https://kovan-testnet.github.io/website',
			}
		case 421611:
			data = {
				...data,
				info_url: data?.info_url || 'https://bridge.arbitrum.io/',
			}
		case 69:
			data = {
				...data,
				coingecko_id: 'ethereum',
			}
			break
		case 56:
		case 97:
			data = {
				info_url: 'https://www.binance.org',
				coingecko_id: 'binancecoin',
			}
			break
		case 137:
		case 80001:
			data = {
				info_url: 'https://polygon.technology',
				coingecko_id: 'matic-network',
			}
			break
		case 43114:
			data = {
				info_url: 'https://www.avax.network',
				coingecko_id: 'avalanche-2',
			}
			break
		case 250:
			data = {
				info_url: 'https://fantom.foundation',
				coingecko_id: 'fantom',
			}
			break
		case 100:
			data = {
				info_url: 'https://gnosischain.com',
				coingecko_id: 'gnosis',
			}
			break
		case 1284:
		case 1287:
			data = {
				info_url: 'https://moonbeam.network',
				coingecko_id: 'moonbeam',
			}
			break
		case 1285:
			data = {
				info_url: 'https://moonbeam.network/networks/moonriver',
				coingecko_id: 'moonriver',
			}
			break
		case 122:
			data = {
				info_url: 'https://fuse.io',
				coingecko_id: 'fuse-network-token',
			}
			break
		case 2001:
			data = {
				info_url: 'https://milkomeda.com',
				coingecko_id: 'cardano',
			}
			break
		case 288:
			data = {
				info_url: 'https://boba.network',
				coingecko_id: 'boba-network',
			}
			break
		case 1666600000:
			data = {
				info_url: 'https://harmony.one',
				coingecko_id: 'harmony',
			}
			break
		default:
			data = {
				info_url: 'https://connext.network',
				coingecko_id: 'connext',
			}
			break
	}

	return data
}