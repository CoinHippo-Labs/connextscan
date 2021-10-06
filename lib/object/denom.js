const denoms = [
  {
    denom: 'uaxl',
    name: 'axl',
    divider: Math.pow(10, 6),
  },
  {
    denom: 'ibc/287EE075B7AADDEB240AFE74FA2108CDACA50A7CCD013FA4C1FCD142AFA9CA9A',
    name: 'photon',
    divider: Math.pow(10, 6),
  },
]

export const feeDenom = 'uaxl'

export const denomName = denom => denoms.findIndex(_denom => _denom.denom === denom) > -1 ? denoms[denoms.findIndex(_denom => _denom.denom === denom)].name : denom

export const denomAmount = (amount, denom) => denoms.findIndex(_denom => _denom.denom === denom) > -1 ? Number(amount) / denoms[denoms.findIndex(_denom => _denom.denom === denom)].divider : Number(amount)