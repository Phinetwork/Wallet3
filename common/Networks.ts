import {
  AVAXPopularTokens,
  ArbiPopularTokens,
  AuroraPopularTokens,
  BobaPopularTokens,
  BscPopularTokens,
  CeloPopularTokens,
  EthereumPopularTokens,
  FTMPopularTokens,
  HarmonyDefaultToken,
  HecoPopularTokens,
  IToken,
  MetisPopularTokens,
  MoonriverDefaultToken,
  NovaPopularTokens,
  OpPopularTokens,
  PolygonPopularTokens,
  RoninPopularTokens,
  xDaiPopularTokens,
  zkSyncFeeTokens,
  zkSyncPopularTokens,
} from './tokens';

import ERC4337Configs from '../configs/erc4337.json';
import { GoerliPopTokens } from './tokens/Goerli';
import { Gwei_1 } from './Constants';
import { MumbaiPopTokens } from './tokens/Mumbai';

export interface IERC4337 {
  bundlerUrls: string[];
  factoryAddress: string;
  entryPointAddress: string;
  paymasterUrl?: string;
}

export interface INetwork {
  comm_id?: string;
  symbol: string;
  network: string;
  chainId: number;
  color: string;
  l2?: boolean;
  eip1559?: boolean;
  erc4337?: IERC4337;
  order?: number;
  defaultTokens: IToken[];
  showOverview?: boolean;
  blockTimeMs?: number;
  explorer: string;
  etherscanApi?: string;
  rpcUrls?: string[];
  addrPrefix?: string;
  github_dir?: string;
  isUserAdded?: boolean;
  feeTokens?: IToken[];
  minWei?: number;
  browserBarIconSize?: number;
  testnet?: boolean;
  pinned?: boolean;
}

export const ChainIds = {
  Ethereum: 1,
  Arbitrum: 42161,
  Optimism: 10,
  Polygon: 137,
  BNBChain: 56,
  Aurora: 1313161554,
  Avalanche: 43114,
  Celo: 42220,
  GnosisChain: 100,
  Fantom: 250,
  Kava: 2222,
  Klaytn: 8217,
};

export const PublicNetworks: INetwork[] = [
  {
    symbol: 'ETH',
    comm_id: 'eth',
    network: 'Ethereum',
    chainId: 1,
    color: '#6186ff',
    eip1559: true,
    order: 1,
    defaultTokens: EthereumPopularTokens,
    blockTimeMs: 12 * 1000,
    explorer: 'https://etherscan.io',
    etherscanApi: 'https://api.etherscan.io/api',
  },
  {
    symbol: 'ETH',
    comm_id: 'arb',
    network: 'Arbitrum One',
    chainId: 42161,
    color: '#28a0f0',
    order: 3,
    l2: true,
    defaultTokens: ArbiPopularTokens,
    showOverview: false,
    explorer: 'https://arbiscan.io',
    etherscanApi: 'https://api.arbiscan.io/api',
    github_dir: 'arbitrum',
  },
  {
    symbol: 'ETH',
    comm_id: 'op',
    network: 'Optimism',
    chainId: 10,
    color: '#FF0420',
    order: 3,
    l2: true,
    defaultTokens: OpPopularTokens,
    showOverview: false,
    explorer: 'https://optimistic.etherscan.io',
    etherscanApi: 'https://api-optimistic.etherscan.io/api',
  },
  {
    symbol: 'MATIC',
    comm_id: 'matic',
    network: 'Polygon',
    chainId: 137,
    color: '#8247E5',
    order: 2,
    eip1559: true,
    defaultTokens: PolygonPopularTokens,
    blockTimeMs: 3 * 1000,
    explorer: 'https://polygonscan.com',
    etherscanApi: 'https://api.polygonscan.com/api',
  },
  {
    symbol: 'BNB',
    comm_id: 'bsc',
    network: 'BNB Chain',
    chainId: 56,
    color: '#f3ba2f',
    order: 5,
    defaultTokens: BscPopularTokens,
    blockTimeMs: 5 * 1000,
    explorer: 'https://bscscan.com',
    etherscanApi: 'https://api.bscscan.com/api',
    github_dir: 'smartchain',
    minWei: 5 * Gwei_1,
  },
  {
    symbol: 'xDAI',
    comm_id: 'xdai',
    network: 'Gnosis Chain',
    chainId: 100,
    color: '#48A9A6',
    order: 3,
    defaultTokens: xDaiPopularTokens,
    blockTimeMs: 5 * 1000,
    explorer: 'https://gnosisscan.io',
    etherscanApi: 'https://api.gnosisscan.io/api',
    eip1559: true,
    github_dir: 'xdai',
  },
  {
    symbol: 'AVAX',
    comm_id: 'avax',
    chainId: 43114,
    network: 'Avalanche',
    color: '#E84142',
    order: 5,
    eip1559: true,
    defaultTokens: AVAXPopularTokens,
    blockTimeMs: 5 * 1000,
    explorer: 'https://snowtrace.io',
    etherscanApi: 'https://api.snowtrace.io/api',
    github_dir: 'avalanchec',
  },
  // {
  //   symbol: 'FIL',
  //   network: 'Filecoin',
  //   chainId: 314,
  //   color: '#0090FF',
  //   defaultTokens: [],
  //   explorer: 'https://beryx.zondax.ch/v1/search/fil/mainnet',
  // },
  {
    symbol: 'ETH',
    comm_id: 'boba',
    network: 'Boba',
    chainId: 288,
    color: '#9ce012',
    l2: true,
    defaultTokens: BobaPopularTokens,
    explorer: 'https://bobascan.com',
    etherscanApi: 'https://api.bobascan.com/api',
  },
  {
    symbol: 'Metis',
    comm_id: 'metis',
    network: 'Metis',
    chainId: 1088,
    color: '#00DACC',
    defaultTokens: MetisPopularTokens,
    l2: true,
    explorer: 'https://andromeda-explorer.metis.io',
    etherscanApi: 'https://andromeda-explorer.metis.io/api',
  },
  {
    symbol: 'CELO',
    comm_id: 'celo',
    chainId: 42220,
    network: 'Celo',
    color: '#35D07F',
    order: 6,
    defaultTokens: CeloPopularTokens,
    blockTimeMs: 5 * 1000,
    explorer: 'https://explorer.celo.org',
    etherscanApi: 'https://explorer.celo.org/api',
  },
  {
    symbol: 'CANTO',
    chainId: 7700,
    network: 'CANTO',
    color: '#06FC99',
    defaultTokens: [],
    explorer: 'https://evm.explorer.canto.io',
    etherscanApi: 'https://evm.explorer.canto.io/api',
  },
  {
    symbol: 'ETH',
    network: 'Arbitrum Nova',
    chainId: 42170,
    color: '#EF8220',
    defaultTokens: NovaPopularTokens,
    explorer: 'https://nova.arbiscan.io',
    etherscanApi: 'https://api-nova.arbiscan.io/api',
  },
  {
    symbol: 'RON',
    comm_id: 'ron',
    chainId: 2020,
    network: 'Ronin',
    color: '#1273EA',
    defaultTokens: RoninPopularTokens,
    explorer: 'https://explorer.roninchain.com',
    addrPrefix: 'ronin:',
  },
  {
    symbol: 'FTM',
    comm_id: 'ftm',
    chainId: 250,
    network: 'Fantom',
    color: '#13b5ec',
    order: 4,
    defaultTokens: FTMPopularTokens,
    blockTimeMs: 10 * 1000,
    explorer: 'https://ftmscan.com',
    etherscanApi: 'https://api.ftmscan.com/api',
  },
  {
    symbol: 'ETH',
    comm_id: 'aurora',
    chainId: 1313161554,
    network: 'Aurora',
    color: '#70d44b',
    defaultTokens: AuroraPopularTokens,
    explorer: 'https://explorer.aurora.dev',
    etherscanApi: 'https://explorer.mainnet.aurora.dev/api',
  },
  {
    symbol: 'EVMOS',
    comm_id: 'evmos',
    chainId: 9001,
    network: 'Evmos',
    color: '#ED4E33',
    defaultTokens: [],
    explorer: 'https://evm.evmos.org',
    etherscanApi: 'https://evm.evmos.org/api',
  },
  {
    symbol: 'KAVA',
    chainId: 2222,
    comm_id: 'kava',
    network: 'Kava',
    color: '#FF433E',
    defaultTokens: [],
    explorer: 'https://explorer.kava.io',
    etherscanApi: 'https://explorer.kava.io/api',
    browserBarIconSize: 18,
  },
  {
    symbol: 'MOVR',
    comm_id: 'movr',
    chainId: 1285,
    network: 'Moonriver',
    color: '#53cbc9',
    defaultTokens: MoonriverDefaultToken,
    explorer: 'https://moonriver.moonscan.io',
    etherscanApi: 'https://api-moonriver.moonscan.io/api',
  },
  {
    symbol: 'GLMR',
    comm_id: 'mobm',
    chainId: 1284,
    network: 'Moonbeam',
    color: '#53cbc9',
    defaultTokens: [],
    explorer: 'https://moonbeam.moonscan.io',
    etherscanApi: 'https://api-moonbeam.moonscan.io/api',
  },
  {
    symbol: 'ONE',
    comm_id: 'hmy',
    network: 'Harmony',
    chainId: 1666600000,
    explorer: 'https://explorer.harmony.one',
    color: '#00aee9',
    defaultTokens: HarmonyDefaultToken,
  },
  {
    symbol: 'DOGE',
    chainId: 2000,
    network: 'DOGE CHAIN',
    color: '#d9bd62',
    defaultTokens: [],
    explorer: 'https://explorer.dogechain.dog',
    etherscanApi: 'https://explorer.dogechain.dog/api',
    github_dir: 'doge',
  },
  {
    symbol: 'ASTR',
    comm_id: 'astr',
    network: 'Astar',
    chainId: 592,
    explorer: 'https://astar.subscan.io',
    color: '#00aee9',
    defaultTokens: [],
  },
  {
    symbol: 'SDN',
    comm_id: 'sdn',
    network: 'Shiden',
    chainId: 336,
    explorer: 'https://shiden.subscan.io',
    color: '#5928b1',
    defaultTokens: [],
  },
  {
    symbol: 'KLAY',
    chainId: 8217,
    comm_id: 'klay',
    network: 'Klaytn',
    color: '#de6b8f',
    defaultTokens: [],
    explorer: 'https://scope.klaytn.com',
  },
  {
    symbol: 'FRA',
    comm_id: 'fra',
    network: 'Findora',
    chainId: 2152,
    explorer: 'https://evm.findorascan.io',
    color: '#7733FF',
    defaultTokens: [],
  },
  {
    symbol: 'FUSE',
    comm_id: 'fuse',
    chainId: 122,
    network: 'Fuse',
    color: '#58ed67',
    defaultTokens: [],
    explorer: 'https://explorer.fuse.io',
    etherscanApi: 'https://explorer.fuse.io/api',
  },
  {
    symbol: 'HT',
    comm_id: 'heco',
    chainId: 128,
    network: 'Heco',
    order: 6,
    color: '#3F7FFF',
    defaultTokens: HecoPopularTokens,
    blockTimeMs: 5 * 1000,
    explorer: 'https://hecoinfo.com',
    etherscanApi: 'https://api.hecoinfo.com/api',
  },
  {
    symbol: 'OKB',
    comm_id: 'okt',
    chainId: 66,
    network: 'OEC',
    order: 7,
    color: '#24c',
    defaultTokens: [],
    blockTimeMs: 5 * 1000,
    explorer: 'https://www.oklink.com/okexchain',
  },
  {
    symbol: 'CRO',
    comm_id: 'cro',
    network: 'Cronos',
    chainId: 25,
    explorer: 'https://cronos.org/explorer',
    etherscanApi: 'https://cronos.org/explorer/api',
    color: '#474169',
    defaultTokens: [],
  },
];

export const Testnets: INetwork[] = [
  {
    comm_id: '',
    symbol: 'ETH',
    network: 'Goerli',
    chainId: 5,
    color: '#6186ff',
    eip1559: true,
    erc4337: ERC4337Configs['5'],
    testnet: true,
    defaultTokens: GoerliPopTokens,
    explorer: 'https://goerli.etherscan.io',
  },
  {
    comm_id: '',
    symbol: 'ETH',
    network: 'Sepolia',
    chainId: 11155111,
    color: '#6186ff',
    eip1559: true,
    // erc4337: ERC4337Configs['11155111'],
    testnet: true,
    defaultTokens: [],
    explorer: 'https://sepolia.etherscan.io',
  },
  {
    comm_id: '',
    symbol: 'ETH',
    network: 'Optimism Goerli',
    chainId: 420,
    color: '#FF0420',
    eip1559: true,
    testnet: true,
    defaultTokens: [],
    explorer: 'https://goerli-optimism.etherscan.io',
  },
  {
    comm_id: '',
    symbol: 'ETH',
    network: 'Arbitrum Goerli',
    chainId: 421613,
    color: '#28a0f0',
    eip1559: true,
    testnet: true,
    defaultTokens: [],
    explorer: 'https://goerli.arbiscan.io',
  },
  {
    symbol: 'ETH',
    network: 'Base Goerli',
    chainId: 84531,
    color: '#588af5',
    eip1559: true,
    // erc4337: ERC4337Configs['84531'],
    testnet: true,
    defaultTokens: [],
    explorer: 'https://goerli.basescan.org',
  },
  {
    comm_id: '',
    symbol: 'MATIC',
    network: 'Mumbai',
    chainId: 80001,
    color: '#8247E5',
    eip1559: true,
    erc4337: ERC4337Configs['80001'],
    defaultTokens: MumbaiPopTokens,
    blockTimeMs: 3 * 1000,
    testnet: true,
    explorer: 'https://mumbai.polygonscan.com',
    etherscanApi: 'https://mumbai.polygonscan.com/api',
  },
  {
    comm_id: '',
    symbol: 'ETH',
    network: 'Japan Open Chain',
    chainId: 99999,
    color: '#BC002D',
    defaultTokens: [],
    blockTimeMs: 3 * 1000,
    testnet: true,
    explorer: 'https://sandbox1.japanopenchain.org',
  },
];

export const AllNetworks: INetwork[] = [...PublicNetworks, ...Testnets];
