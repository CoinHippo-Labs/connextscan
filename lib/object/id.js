export const type = id => {
	const hashRegEx = new RegExp(/[0-9A-F]{64}$/, 'igm')
  const validatorRegEx = new RegExp(`${process.env.NEXT_PUBLIC_PREFIX_VALIDATOR}.*$`, 'igm')
  const validatorATOMRegEx = new RegExp(`${process.env.NEXT_PUBLIC_PREFIX_VALIDATOR.replace('axelar', 'cosmos')}.*$`, 'igm')
  const accountRegEx = new RegExp(`${process.env.NEXT_PUBLIC_PREFIX_ACCOUNT}.*$`, 'igm')
  const accountATOMRegEx = new RegExp(`${process.env.NEXT_PUBLIC_PREFIX_ACCOUNT.replace('axelar', 'cosmos')}.*$`, 'igm')

  return !id ? null : !isNaN(id) ? 'blocks' : id.match(validatorRegEx) || id.match(validatorATOMRegEx) ? 'validator' : id.match(accountRegEx) || id.match(accountATOMRegEx) ? 'account' : 'tx'
}