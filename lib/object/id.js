export const type = id => {
	const txRegEx = new RegExp(/^0x([A-Fa-f0-9]{64})$/, 'igm')
  const addressRegEx = new RegExp(/^0x[a-fA-F0-9]{40}$/, 'igm')

  return !id ? null : id.match(txRegEx) ? 'tx' : id.match(addressRegEx) ? 'address' : 'tx'
}