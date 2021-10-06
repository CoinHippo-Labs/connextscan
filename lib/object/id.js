export const type = id => {
	const hashRegEx = new RegExp(/[0-9A-F]{64}$/, 'igm')
  const validatorRegEx = new RegExp(`${process.env.NEXT_PUBLIC_PREFIX_VALIDATOR}.*$`, 'igm')
  const accountRegEx = new RegExp(`${process.env.NEXT_PUBLIC_PREFIX_ACCOUNT}.*$`, 'igm')

  return !id ? null : !isNaN(id) ? 'blocks' : id.match(validatorRegEx) ? 'validator' : id.match(accountRegEx) ? 'account' : 'tx'
}