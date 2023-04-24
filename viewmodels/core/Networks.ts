import * as ethers from 'ethers';

import { AllNetworks, INetwork, PublicNetworks, Testnets } from '../../common/Networks';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import { callRPC, deleteRPCUrlCache, getNextBlockBaseFeeByRPC } from '../../common/RPC';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Chain from '../../models/entities/Chain';
import Database from '../../models/Database';
import { DebankSupportedChains } from '../../common/apis/Debank';
import ImageColors from 'react-native-image-colors';
import { In } from 'typeorm';
import icons from '../../assets/icons/crypto';
import providers from '../../configs/providers.json';

const ChainColors = {
  61: '#3ab83a',
};

const Keys = {
  currentNetwork: 'network',
  pinnedChains: 'networks_pinned_chains',
};

export interface AddEthereumChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string; // 2-6 characters long
    decimals: 18;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[]; // Currently ignored.
}

class Networks {
  current: INetwork = PublicNetworks[0];
  userChains: INetwork[] = [];
  pinnedChains: number[] = [];

  get Ethereum() {
    return PublicNetworks[0];
  }

  get Optimism() {
    return PublicNetworks[2];
  }

  get Arbitrum() {
    return PublicNetworks[1];
  }

  get Polygon() {
    return PublicNetworks[3];
  }

  get _all() {
    return AllNetworks.concat(this.userChains);
  }

  get all(): INetwork[] {
    return this.pinnedChains
      .map((chainId) => this.find(chainId)!)
      .filter((i) => i)
      .concat(this._all.filter((network) => !this.pinnedChains.includes(network.chainId)));
  }

  get categorized() {
    const unpinned = PublicNetworks.filter((network) => !this.pinnedChains.includes(network.chainId));

    const groups = [
      { category: 'pinned', data: this.pinnedChains.map((chainId) => this.find(chainId)!) },
      { category: 'core', data: unpinned.filter((n) => n.category === 'core') },
      { category: 'l2', data: unpinned.filter((n) => n.l2 && n.category !== 'core') },
      {
        category: 'evm-compatible',
        data: unpinned.filter((n) => (!n.category || n.category === 'evm-compatible') && !n.l2),
      },
      { category: 'user-added', data: this.userChains },
      { category: 'testnet', data: Testnets },
    ];

    return groups.filter((g) => g.data.length > 0);
  }

  get categorized4337() {
    return this.categorized.map((g) => ({ ...g, data: g.data.filter((i) => i.erc4337) })).filter((g) => g.data.length > 0);
  }

  constructor() {
    makeObservable(this, {
      current: observable,
      switch: action,
      reset: action,
      remove: action,
      pin: action,
      unpin: action,
      userChains: observable,
      pinnedChains: observable,

      _all: computed,
      all: computed,
      categorized: computed,
    });
  }

  async init() {
    const chains = await Database.chains.find();
    const userEditedSystemChains = chains.filter((c) => AllNetworks.find((n) => n.chainId === Number(c.id)));

    for (let sc of userEditedSystemChains) {
      const pn = PublicNetworks.find((n) => n.chainId === Number(sc.id));
      if (!pn) continue;

      pn.rpcUrls = sc.rpcUrls;
    }

    const userChains = chains
      .filter((c) => !userEditedSystemChains.find((sc) => sc.id === c.id))
      .map<INetwork>((c) => {
        return {
          chainId: Number(c.id),
          color: c.customize?.color || '#7B68EE',
          comm_id: c.customize?.comm_id || c.name.toLowerCase(),
          explorer: c.explorer,
          symbol: c.symbol,
          defaultTokens: [],
          network: c.name,
          rpcUrls: c.rpcUrls,
          eip1559: c.customize?.eip1559,
          isUserAdded: true,
        };
      });

    await runInAction(async () => (this.userChains = userChains));

    AsyncStorage.getItem(Keys.currentNetwork).then((chainId) => {
      const chain = Number(chainId || 1);
      runInAction(() => (this.current = this._all.find((n) => n.chainId === chain) || PublicNetworks[0]));
    });

    AsyncStorage.getItem(Keys.pinnedChains).then((values) => {
      const pinned = JSON.parse(values || '[]');
      runInAction(() => (this.pinnedChains = pinned));

      for (let id of pinned) {
        let n = this.find(id);
        if (n) n.pinned = true;
      }
    });
  }

  switch = (network: INetwork) => {
    if (this.current.chainId === network.chainId) return;

    this.current = network;
    AsyncStorage.setItem(Keys.currentNetwork, JSON.stringify(network.chainId));
  };

  pin = (network: INetwork) => {
    network.pinned = true;
    if (this.pinnedChains.includes(network.chainId)) return;
    this.pinnedChains.unshift(network.chainId);
    AsyncStorage.setItem(Keys.pinnedChains, JSON.stringify(this.pinnedChains));
  };

  unpin = (network: INetwork) => {
    network.pinned = false;
    if (!this.pinnedChains.includes(network.chainId)) return;
    this.pinnedChains = this.pinnedChains.filter((i) => i !== network.chainId);
    AsyncStorage.setItem(Keys.pinnedChains, JSON.stringify(this.pinnedChains));
  };

  has = (chainId: number | string) => {
    return this._all.some((n) => n.chainId === Number(chainId));
  };

  find = (chainId: number | string) => {
    return this._all.find((n) => n.chainId === Number(chainId));
  };

  remove = async (chainId: number) => {
    const chain = this.userChains.find((c) => c.chainId === chainId);
    if (!chain) return;

    const isCurrent = this.current.chainId === chainId;

    this.userChains = this.userChains.filter((c) => c.chainId !== chainId);

    const userChain = await Database.chains.findOne({
      where: { id: In([`0x${chainId.toString(16)}`, `${chainId}`, chainId.toString(16)]) },
    });

    if (isCurrent) this.switch(this.Ethereum);

    await Promise.all([userChain?.remove(), this.unpin(chain)]);
  };

  reset = () => {
    this.switch(this.Ethereum);
    this.userChains = [];
  };

  add = async (chain: AddEthereumChainParameter) => {
    if (!Number.isSafeInteger(Number(chain?.chainId))) return false;
    if (this.find(chain.chainId)) return false;
    if (chain.rpcUrls?.length === 0) return false;

    const nc = (await Database.chains.findOne({ where: { id: chain.chainId } })) || new Chain();

    nc.id = chain.chainId;
    nc.name = chain.chainName || 'EVM-Compatible';
    nc.explorer = chain.blockExplorerUrls?.[0] || '';
    nc.rpcUrls = chain.rpcUrls;
    nc.symbol = (chain.nativeCurrency.symbol || 'ETH').toUpperCase();
    nc.customize = nc.customize ?? {
      color: ChainColors[Number(chain.chainId)] || '#7B68EE',
      eip1559: false,
      comm_id: DebankSupportedChains.get(Number(chain.chainId)),
    };

    try {
      const priFee = await getNextBlockBaseFeeByRPC(chain.rpcUrls[0]);
      nc.customize.eip1559 = priFee >= 1;

      const icon = icons[nc.symbol.toLowerCase()];

      if (icon) {
        const result = await ImageColors.getColors(icon);

        switch (result.platform) {
          case 'android':
            nc.customize.color = result.dominant || nc.customize.color;
            break;
          case 'ios':
            nc.customize.color = result.background || nc.customize.color;
            break;
        }
      }
    } catch (error) {}

    runInAction(() => {
      this.userChains.push({
        chainId: Number(chain.chainId),
        color: nc.customize!.color!,
        network: nc.name,
        comm_id: DebankSupportedChains.get(Number(chain.chainId)) || nc.symbol.toLowerCase(),
        defaultTokens: [],
        explorer: nc.explorer,
        symbol: nc.symbol,
        rpcUrls: chain.rpcUrls,
        eip1559: nc.customize?.eip1559,
        isUserAdded: true,
      });
    });

    await nc.save();

    return true;
  };

  update = async (network: INetwork) => {
    const value = this.find(network.chainId);
    if (!value) return;

    runInAction(() => {
      value.network = network.network;
      value.symbol = network.symbol;
      value.explorer = network.explorer;
      value.color = network.color;
      value.rpcUrls = network.rpcUrls;
    });

    let userChain = await Database.chains.findOne({
      where: { id: In([`0x${value.chainId.toString(16)}`, `${value.chainId}`, value.chainId.toString(16)]) },
    });

    if (!userChain) {
      userChain = new Chain();
      userChain.id = `${network.chainId}`;
    }

    userChain.name = network.network;
    userChain.explorer = network.explorer;
    userChain.rpcUrls = network.rpcUrls?.filter((i) => i) || [];
    userChain.symbol = network.symbol;

    if (userChain.customize) {
      userChain.customize!.color = network.color;
    }

    userChain.save();

    deleteRPCUrlCache(value.chainId);
  };

  get MainnetWsProvider() {
    const [wss] = (providers['1'] as string[]).filter((r) => r.startsWith('wss://'));
    const provider = new ethers.providers.WebSocketProvider(wss, 1);

    return provider;
  }

  testRPC = async (rpcUrl: string, expectedChainId: number | string) => {
    try {
      const chainId = await callRPC(rpcUrl, { method: 'eth_chainId' });
      return Number(chainId) === Number(expectedChainId);
    } catch (error) {}

    return false;
  };
}

export default new Networks();
