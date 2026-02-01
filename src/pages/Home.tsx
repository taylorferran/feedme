import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <div className="text-8xl mb-6">🐙</div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          FeedMe
        </h1>
        <p className="text-xl text-zinc-400 mb-8">
          Feed your positions, not your wallet
        </p>
        <p className="text-zinc-500 mb-12">
          Receive payments directly into your DeFi positions. Cross-chain swaps,
          bridges, and deposits — all in one transaction.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            to="/setup"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
          >
            Setup Your Monster
          </Link>
          <Link
            to="/vitalik.eth"
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors border border-zinc-700"
          >
            View Demo
          </Link>
        </div>
      </div>
    </div>
  )
}
