import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Gothic cover background */}
      <div
        className="absolute inset-0 opacity-15 bg-cover bg-center"
        style={{ backgroundImage: 'url(/cover.png)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]" />

      <div className="text-center max-w-2xl relative z-10">
        {/* Logo image */}
        <div className="mb-6 flex justify-center">
          <img
            src="/logo.png"
            alt="FeedMe"
            className="w-32 h-32 rounded-sm animate-pulse drop-shadow-[0_0_30px_rgba(153,27,27,0.5)] border-2 border-red-900/30"
          />
        </div>
        <h1 className="font-horror text-6xl md:text-7xl mb-4 text-red-800 drop-shadow-[0_0_20px_rgba(153,27,27,0.4)]">
          FeedMe
        </h1>
        <p className="text-xl text-stone-400 mb-8 font-brutal tracking-wider">
          Feed your positions, not your wallet
        </p>
        <p className="text-stone-500 mb-12 leading-relaxed">
          Receive payments directly into your DeFi positions. Cross-chain swaps,
          bridges, and deposits — all in one transaction.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            to="/setup"
            className="px-8 py-4 bg-red-900 hover:bg-red-800 border-2 border-red-700 rounded-sm font-bold uppercase tracking-widest transition-all hover:shadow-[0_0_30px_rgba(153,27,27,0.4)] hover:-translate-y-0.5"
          >
            Summon Your Monster
          </Link>
          <Link
            to="/monsters"
            className="px-8 py-4 bg-stone-900 hover:bg-stone-800 border-2 border-stone-700 rounded-sm font-bold uppercase tracking-widest transition-all hover:border-stone-500"
          >
            Your Creatures
          </Link>
        </div>

        {/* Quick demo link */}
        <div className="mt-12">
          <Link
            to="/taylorferran.eth"
            className="text-sm text-stone-600 hover:text-red-500 transition-colors font-mono"
          >
            [ view taylorferran.eth → ]
          </Link>
        </div>
      </div>
    </div>
  )
}
