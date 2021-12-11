import ChainInfo from '../../components/crosschain/chain-info'
import LeaderboardRouters from '../../components/crosschain/leaderboard/routers'
import SectionTitle from '../../components/section-title'

export default function RoutersIndex() {
  return (
    <>
      <SectionTitle
        title="Leaderboard"
        subtitle="Routers"
        right={<ChainInfo />}
        className="flex-col sm:flex-row items-start sm:items-center"
      />
      <div className="max-w-6xl my-4 mx-auto pb-2">
        <LeaderboardRouters />
      </div>
    </>
  )
}