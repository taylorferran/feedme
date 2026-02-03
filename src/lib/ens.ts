import { namehash, encodeFunctionData } from 'viem'

// Mainnet ENS contracts
export const ENS_CONTRACTS = {
  registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  publicResolver: '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63',
  nameWrapper: '0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401',
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

// NameWrapper ABI (for wrapped names - ERC1155)
export const NAME_WRAPPER_ABI = [
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ name: 'owner', type: 'address' }],
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
