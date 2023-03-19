import * as Linking from 'expo-linking';

import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import { Core } from '@walletconnect/core';
import { DAY } from '../../utils/time';
import Database from '../../models/Database';
import EventEmitter from 'events';
import LINQ from 'linq';
import MessageKeys from '../../common/MessageKeys';
import WCSession_v1 from '../../models/entities/WCSession_v1';
import WCV2_Session from '../../models/entities/WCSession_v2';
import { WalletConnect2ProjectID } from '../../configs/secret';
import { WalletConnect_v1 } from './WalletConnect_v1';
import { WalletConnect_v2 } from './WalletConnect_v2';
import { Web3Wallet } from '@walletconnect/web3wallet';
import { Web3Wallet as Web3WalletType } from '@walletconnect/web3wallet/dist/types/client';

const walletMeta = {
  name: 'Wallet 3',
  description: 'A Secure Wallet for Web3',
  icons: ['https://github.com/Wallet3/Wallet3/blob/ios-wc2/assets/icon@128.rounded.png?raw=true'],
  url: 'https://wallet3.io',
};

type Topic = string;

type Extra = { hostname?: string; fromMobile?: boolean };

class WalletConnectHub extends EventEmitter {
  private walletconnect2!: Web3WalletType;

  v1Clients: WalletConnect_v1[] = [];
  pendingV2Clients = new Map<Topic, WalletConnect_v2>();
  v2Clients = new Map<Topic, WalletConnect_v2>();

  get connectedCount() {
    return this.v1Clients.length + this.v2Clients.size;
  }

  get clients() {
    return LINQ.from([...this.v1Clients, ...this.v2Clients.values()])
      .where((i) => (i ? true : false))
      .orderByDescending((i) => i.lastUsedTimestamp)
      .toArray();
  }

  constructor() {
    super();
    makeObservable(this, {
      v1Clients: observable,
      v2Clients: observable,
      clients: computed,
      connectedCount: computed,
      reset: action,
    });
  }

  async init() {
    const lastUsedExpiry = Date.now() - 30 * DAY;

    // Restore sessions
    const [v1Sessions, v2Sessions] = await Promise.all([Database.wcV1Sessions.find(), Database.wcV2Sessions.find()]);
    const cs = await Promise.all(
      v1Sessions.map(async (sessionStore) =>
        new WalletConnect_v1().connectSession(sessionStore.session).setStore(sessionStore)
      )
    );

    runInAction(() => {
      this.v1Clients = cs;
      this.v1Clients.forEach((client) => this.handleLifecycle(client));
      this.v1Clients.filter((c) => c.lastUsedTimestamp < lastUsedExpiry).forEach((c) => c.killSession());
    });

    if (v2Sessions.length === 0) return;

    await this.lazyInitWalletConnectV2(v2Sessions);
  }

  async connect(uri: string, extra?: Extra) {
    const linking = Linking.parse(uri);
    const [_, version] = linking.path?.split('@') ?? [];

    switch (version) {
      case '1':
        let client: WalletConnect_v1;

        try {
          client = new WalletConnect_v1(uri);
        } catch (error) {
          return;
        }

        const store = new WCSession_v1();
        store.id = Date.now();
        client.setStore(store);

        client.once('sessionApproved', () => {
          runInAction(() => this.v1Clients.push(client));

          store.session = client.session;
          store.lastUsedTimestamp = Date.now();

          store.isMobile = extra?.fromMobile ?? false;
          store.hostname = extra?.hostname ?? '';

          store.save();

          if (extra?.fromMobile) setTimeout(() => this.emit('mobileAppConnected', client), 100);
        });

        this.handleLifecycle(client);
        return client;
      case '2':
        await this.lazyInitWalletConnectV2([]);

        const pairing = await this.walletconnect2.core.pairing.pair({ uri, activatePairing: true });
        const client_v2 = new WalletConnect_v2(this.walletconnect2);
        client_v2.store.isMobile = extra?.fromMobile ?? false;
        client_v2.store.hostname = extra?.hostname || '';

        this.pendingV2Clients.set(pairing.topic, client_v2);
        this.handleV2Lifecycle(client_v2, pairing.topic, extra);

        return client_v2;
    }
  }

  private async lazyInitWalletConnectV2(v2Sessions: WCV2_Session[]) {
    if (this.walletconnect2) return;
    const lastUsedExpiry = Date.now() - 30 * DAY;

    this.walletconnect2 = await Web3Wallet.init({
      core: new Core({ projectId: WalletConnect2ProjectID }),
      metadata: walletMeta,
    });

    this.walletconnect2.on('session_proposal', async (proposal) => {
      const client = this.pendingV2Clients.get(proposal.params.pairingTopic!) || new WalletConnect_v2(this.walletconnect2);

      this.handleV2Lifecycle(client, proposal.params.pairingTopic);
      this.pendingV2Clients.set(proposal.params.pairingTopic!, client);

      if (await client.handleSessionProposal(proposal)) {
        PubSub.publish(MessageKeys.walletconnect.pairing_request, { client });
      } else {
        client.killSession();
        this.pendingV2Clients.delete(proposal.params.pairingTopic!);
      }

      this.cleanInactiveV2();
    });

    this.walletconnect2.on('session_request', async (request) => {
      await this.v2Clients.get(request.topic)?.handleSessionRequest(request);
      this.cleanInactiveV2();
    });

    const v2Clients = v2Sessions.map((store) => new WalletConnect_v2(this.walletconnect2, store));
    v2Clients.filter((c) => c.lastUsedTimestamp < lastUsedExpiry).forEach((c) => c.killSession());

    runInAction(() => {
      for (let c of v2Clients.filter((c) => c.lastUsedTimestamp > lastUsedExpiry)) {
        this.v2Clients.set(c.session!.topic, c);
        this.handleV2Lifecycle(c);
      }
    });

    this.cleanInactiveV2();
  }

  private handleLifecycle = (client: WalletConnect_v1) => {
    client.on('sessionUpdated', () => {
      if (!client.store) return;
      client.store.lastUsedTimestamp = Date.now();
      client.store.save();
    });

    client.once('disconnect', () => {
      client.store?.remove?.();
      if (!this.v1Clients.includes(client)) return;
      runInAction(() => (this.v1Clients = this.v1Clients.filter((c) => c !== client)));
    });
  };

  private handleV2Lifecycle = (client: WalletConnect_v2, pairingTopic?: string, extra?: Extra) => {
    client.once('sessionApproved', () => {
      this.pendingV2Clients.delete(pairingTopic || '');
      runInAction(() => this.v2Clients.set(client.session!.topic, client));
      setTimeout(() => this.emit('mobileAppConnected', client), 1000);
    });

    client.once('disconnect', () => {
      runInAction(() => this.v2Clients.delete(client.session!.topic));
    });

    client.once(MessageKeys.walletconnect.notSupportedSessionProposal, () => {
      this.pendingV2Clients.delete(pairingTopic || '');
      runInAction(() => this.v2Clients.delete(client.session?.topic || ''));
    });
  };

  private cleanInactiveV2() {
    if (!this.walletconnect2) return;

    for (let [_, client] of this.v2Clients) {
      if (!this.walletconnect2.getActiveSessions()[client.session?.topic || '']) {
        client.killSession();
      }
    }
  }

  find(hostname: string) {
    if (!hostname) return;

    return LINQ.from(this.clients.filter((c) => c.origin === hostname))
      .orderByDescending((i) => i.lastUsedTimestamp)
      .firstOrDefault();
  }

  reset() {
    this.clients.forEach((c) => {
      c.killSession();
      c.dispose();
    });

    this.v1Clients = [];
    this.v2Clients.clear();
  }
}

export default new WalletConnectHub();
