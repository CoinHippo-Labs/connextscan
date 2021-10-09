import { useSelector, shallowEqual } from 'react-redux'

export default function Bridges() {
	const { assets } = useSelector(state => ({ assets: state.assets }), shallowEqual)
  const { assets_data } = { ...assets }

  return (
    <></>
  )
}