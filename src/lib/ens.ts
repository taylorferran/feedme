import { namehash, encodeFunctionData } from 'viem'

// Sepolia ENS contracts
export const ENS_CONTRACTS = {
  registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  publicResolver: '0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5',
  nameWrapper: '0x0635513f179D50A207757E05759CbD106d7dFcE8',
} as const

// FeedMe text record keys
export const FEEDME_KEYS = {
  chain: 'feedme.chain',
  token: 'feedme.token',
  protocol: 'feedme.protocol',
  action: 'feedme.action',
  vault: 'feedme.vault',
  monsterName: 'feedme.monsterName',
  monsterType: 'feedme.monsterType',
} as const

// Public Resolver ABI (just the functions we need)
export const PUBLIC_RESOLVER_ABI = [
  {
    name: 'setText',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'text',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
    ],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'multicall',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'data', type: 'bytes[]' }],
    outputs: [{ name: 'results', type: 'bytes[]' }],
  },
] as const

// ENS Registry ABI (to check ownership/resolver)
export const ENS_REGISTRY_ABI = [
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'resolver',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

// Helper to get namehash
export function getNamehash(ensName: string): `0x${string}` {
  return namehash(ensName)
}

// Encode multiple setText calls for multicall
export function encodeSetTextCalls(
  node: `0x${string}`,
  records: Record<string, string>
): `0x${string}`[] {
  return Object.entries(records).map(([key, value]) =>
    encodeFunctionData({
      abi: PUBLIC_RESOLVER_ABI,
      functionName: 'setText',
      args: [node, key, value],
    })
  )
}
