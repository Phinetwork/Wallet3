import * as Linking from 'expo-linking';

import Networks, { AddEthereumChainParameter } from '../../../viewmodels/core/Networks';
import { providers, utils } from 'ethers';

import { AccountBase } from '../../../viewmodels/account/AccountBase';
import App from '../../../viewmodels/core/App';
import { AuthOptions } from '../../../viewmodels/auth/Authentication';
import DeviceInfo from 'react-native-device-info';
import { ERC20Token } from '../../../models/ERC20';
import EventEmitter from 'events';
import { INetwork } from '../../../common/Networks';
import InpageDApp from '../../../models/entities/InpageDApp';
import MessageKeys from '../../../common/MessageKeys';
import MetamaskDAppsHub from '../../../viewmodels/walletconnect/MetamaskDAppsHub';
import { PageMetadata } from '../Web3View';
import { RawTransactionRequest } from '../../../viewmodels/transferring/RawTransactionRequest';
import { ReadableInfo } from '../../../models/entities/Transaction';
import { SendTxRequest } from '../../../viewmodels/account/AccountBase';
import { SignTypedDataVersion } from '@metamask/eth-sig-util';
import { WCCallRequest_eth_sendTransaction } from '../../../models/entities/WCSession_v1';
import i18n from '../../../i18n';
import { isSecureSite } from '../../../viewmodels/customs/Bookmarks';
import { logInpageRequest } from '../../../viewmodels/services/Analytics';
import { parseSignParams } from '../../../utils/sign';
import { rawCall } from '../../../common/RPC';
import { showMessage } from 'react-native-flash-message';
import { sleep } from '../../../utils/async';

const NOTIFICATION_NAMES = {
  accountsChanged: 'metamask_accountsChanged',
  unlockStateChanged: 'metamask_unlockStateChanged',
  chainChanged: 'metamask_chainChanged',
};

interface JsonRpcRequest {
  id?: number | string;
  jsonrpc: '2.0';
  method: string;
  params?: Array<any> | any;
}

interface JsonRpcResponse {
  id: string | undefined;
  jsonrpc: '2.0';
  method: string;
  result?: unknown;
  error?: Error;
}

interface Payload extends JsonRpcRequest {
  pageMetadata?: PageMetadata;
}

interface WatchAssetParams {
  type: 'ERC20'; // In the future, other standards will be supported
  options: {
    address: string; // The address of the token contract
    symbol: string; // A ticker symbol or shorthand, up to 5 characters
    decimals: number; // The number of token decimals
    image: string | string[]; // A string url of the token logo
  };
}

export interface ConnectInpageDApp extends Payload {
  origin: string;
  approve: (userSelected: { network: INetwork; account: AccountBase }) => void;
  reject: () => void;
}

export interface InpageDAppSignRequest {
  type: 'plaintext' | 'typedData';
  chainId: number;
  msg?: string;
  typedData?: any;
  approve: (opt?: { pin?: string; standardMode?: boolean }) => Promise<boolean>;
  reject: () => void;
  account: AccountBase;
  metadata: PageMetadata;
}

export interface InpageDAppTxRequest {
  vm: RawTransactionRequest;
  app: { name: string; icon: string; verified: boolean };
  approve: (obj: SendTxRequest & AuthOptions) => Promise<boolean>;
  reject: () => void;
}

export interface InpageDAppAddEthereumChain {
  approve: () => void;
  reject: () => void;
  chain: AddEthereumChainParameter;
}

export interface InpageDAppAddAsset {
  approve: () => void;
  reject: () => void;
  asset: WatchAssetParams;
}

const Code_InvalidParams = -32602;
const Code_UserRejected = 4001;

export class InpageDAppController extends EventEmitter {
  private static _lastModalRequestTimestamp = Date.now();

  constructor() {
    super();
  }

  private async awaitModalFinished() {
    if (Date.now() - InpageDAppController._lastModalRequestTimestamp < 2000) {
      await sleep(1750);
    }

    InpageDAppController._lastModalRequestTimestamp = Date.now();
  }

  async handle(origin: string, payload: Payload) {
    const { hostname } = Linking.parse(origin);
    const { method, params, id, jsonrpc } = payload;
    let result: any | null = null;

    switch (method) {
      case 'metamask_getProviderState':
        const initDApp = this.getDApp(hostname!);
        const initAccount = initDApp?.lastUsedAccount || '';

        result = {
          isInitialized: true,
          isUnlocked: true,
          network: Number(initDApp?.lastUsedChainId) || Networks.current.chainId,
          selectedAddress: initAccount,
          accounts: [initAccount],
        };
        break;
      case 'web3_clientVersion':
        result = `Wallet3/${DeviceInfo.getVersion()}/Mobile`;
        break;
      case 'eth_accounts':
        const account = this.getDApp(hostname!)?.lastUsedAccount;
        result = account && App.allAccounts.find((a) => a.address === account) ? [account] : [];
        break;
      case 'eth_coinbase':
        const coinbase = this.getDApp(hostname!)?.lastUsedAccount;
        result = coinbase ? [coinbase] : null;
        break;
      case 'eth_requestAccounts':
        result = await this.eth_requestAccounts(hostname!, payload);
        break;
      case 'net_version':
        result = `${Number(this.getDApp(hostname!)?.lastUsedChainId ?? 1)}`;
        break;
      case 'eth_chainId':
        result = `0x${Number(this.getDApp(hostname!)?.lastUsedChainId ?? Networks.current.chainId).toString(16)}`;
        break;
      case 'wallet_switchEthereumChain':
        result = await this.wallet_switchEthereumChain(hostname!, params);
        break;
      case 'eth_sign':
      case 'personal_sign':
      case 'eth_signTypedData':
      case 'eth_signTypedData_v3':
      case 'eth_signTypedData_v4':
        await this.awaitModalFinished();
        result = await this.sign(hostname!, params, method);
        await this.awaitModalFinished();
        break;
      case 'eth_sendTransaction':
        await this.awaitModalFinished();
        result = await this.eth_sendTransaction(hostname!, payload);
        await this.awaitModalFinished();
        break;
      case 'wallet_addEthereumChain':
        result = await this.wallet_addEthereumChain(hostname!, params);
        break;
      case 'wallet_watchAsset':
        result = await this.wallet_watchAsset(hostname!, params);
        break;
      case 'eth_getEncryptionPublicKey':
      case 'eth_decrypt':
        break;
      case 'personal_ecRecover':
        result = await this.personal_ecRecover(hostname!, params);
        break;
      default:
        const dapp = this.getDApp(hostname!);
        if (dapp) result = await rawCall(dapp.lastUsedChainId, { method, params });
        if (result === undefined && method === 'eth_estimateGas') result = '0x0';
        break;
    }

    return {
      name: 'metamask-provider',
      data: { id, jsonrpc, error: result?.error, result: result?.error ? undefined : result },
    };
  }

  getDApp(hostname: string) {
    return MetamaskDAppsHub.find(hostname);
  }

  private async eth_requestAccounts(origin: string, payload: Payload) {
    if (!App.currentAccount) return [];

    const dapp = this.getDApp(origin);

    if (dapp) {
      const account = App.allAccounts.find((a) => a.address === dapp.lastUsedAccount); // Ensure last used account is still available)

      if (account) {
        return [account.address];
      }
    }

    return new Promise<string[] | any>((resolve) => {
      const approve = ({ account, network }: { account: AccountBase; network: INetwork }) => {
        const app = new InpageDApp();
        app.origin = origin;
        app.lastUsedAccount = account.address;
        app.lastUsedChainId = `0x${Number(network.chainId).toString(16)}`;
        app.lastUsedTimestamp = Date.now();
        app.metadata = payload.pageMetadata || { icon: '', title: origin };

        resolve([account.address]);

        this.emit('dappConnected', app);
        app.save();

        MetamaskDAppsHub.add(app);
      };

      const reject = () => resolve({ error: { code: Code_UserRejected, message: 'The request was rejected by the user' } });
      PubSub.publish(MessageKeys.openConnectInpageDApp, { approve, reject, origin, ...payload } as ConnectInpageDApp);
    });
  }

  private async wallet_switchEthereumChain(origin: string, params: { chainId: string }[]) {
    const dapp = this.getDApp(origin);
    if (!dapp) return null;

    if (!Array.isArray(params)) return null;

    const targetChainId = params[0].chainId;
    if (Number(dapp.lastUsedChainId) === Number(targetChainId)) return null;
    if (!Networks.has(targetChainId)) return { error: { code: 4902, message: 'the chain has not been added to Wallet 3' } };

    this.setDAppChainId(origin, targetChainId, 'inpage');

    return null;
  }

  private async sign(origin: string, params: string[], method: string) {
    const dapp = this.getDApp(origin);
    if (!dapp) return;

    const account = App.findAccount(dapp.lastUsedAccount);
    if (!account) {
      showMessage({ message: i18n.t('msg-account-not-found'), type: 'warning' });
      return { error: { code: Code_InvalidParams, message: 'Invalid account' } };
    }

    dapp.setLastUsedTimestamp(Date.now());

    return new Promise((resolve) => {
      let msg: Uint8Array | string | undefined = undefined;
      let typedData: any;
      let type: 'plaintext' | 'typedData' = 'plaintext';
      let typedVersion = SignTypedDataVersion.V4;

      const approve = async ({ pin }: { pin?: string; standardMode?: boolean } = {}) => {
        const signed =
          type === 'typedData'
            ? await account.signTypedData({ typedData, pin, version: typedVersion, disableAutoPinRequest: true })
            : await account.signMessage(msg!, { pin, disableAutoPinRequest: true });

        if (signed) resolve(signed);

        return signed ? true : false;
      };

      const reject = () => resolve({ error: { code: Code_UserRejected, message: 'User rejected' } });

      switch (method) {
        case 'personal_sign':
        case 'eth_sign':
          const { data } = parseSignParams(params, method === 'eth_sign');
          msg = data;
          type = 'plaintext';
          break;
        case 'eth_signTypedData':
          typedData = params[0];
          type = 'typedData';
          typedVersion = SignTypedDataVersion.V1;
          break;
        case 'eth_signTypedData_v3':
          typedData = JSON.parse(params[1]);
          type = 'typedData';
          typedVersion = SignTypedDataVersion.V3;
          break;
        case 'eth_signTypedData_v4':
          typedData = JSON.parse(params[1]);
          type = 'typedData';
          typedVersion = SignTypedDataVersion.V4;
          break;
      }

      PubSub.publish(MessageKeys.openInpageDAppSign, {
        msg,
        typedData,
        type,
        approve,
        reject,
        chainId: Number(dapp.lastUsedChainId),
        account,
        metadata: { ...dapp.appMeta, icon: dapp.appMeta?.icons?.[0], origin: dapp.appMeta?.url },
      } as InpageDAppSignRequest);
    });
  }

  private async eth_sendTransaction(origin: string, payload: Payload) {
    const dapp = this.getDApp(origin);
    if (!dapp) return null;

    const { params, pageMetadata } = payload;

    dapp.setLastUsedTimestamp(Date.now());

    return new Promise<string | any>((resolve) => {
      const param = params[0] as WCCallRequest_eth_sendTransaction;
      const network = Networks.find(dapp.lastUsedChainId)!;
      const account = App.findAccount(dapp.lastUsedAccount);

      if (!network || !account) {
        resolve({ error: { code: Code_InvalidParams, message: 'No such network or account' } });
        return;
      }

      const vm = new RawTransactionRequest({ param, network, account });

      const approve = async (args: SendTxRequest & AuthOptions) => {
        const { success, txHash, error, txHashPromise } = await vm.sendTx({
          ...args,
          network,
          readableInfo: { ...args.readableInfo, dapp: pageMetadata?.title ?? '', icon: pageMetadata?.icon },
        });

        if (error && __DEV__) showMessage({ type: 'warning', message: error.message });

        if (txHash) {
          resolve(txHash);
          return true;
        }

        if (error) {
          resolve(error);
          return false;
        }

        txHashPromise?.then((tx) => {
          resolve(tx);
          console.log('tx hash resolved', tx);
        });
        
        return txHashPromise || success ? true : false;
      };

      const reject = () => resolve({ error: { code: Code_UserRejected, message: 'The request was rejected by the user' } });

      PubSub.publish(MessageKeys.openInpageDAppSendTransaction, {
        approve,
        reject,
        app: { name: pageMetadata!.title, icon: pageMetadata!.icon, verified: isSecureSite(pageMetadata!.origin) },
        vm,
      } as InpageDAppTxRequest);
    });
  }

  private async wallet_addEthereumChain(origin: string, params: AddEthereumChainParameter[]) {
    if (!params?.length) return { error: { code: Code_InvalidParams, message: 'Invalid request' } };

    const chain = params[0];

    if (
      !chain ||
      !Array.isArray(chain.rpcUrls) ||
      !Array.isArray(chain.blockExplorerUrls) ||
      !chain.nativeCurrency ||
      !Number.isInteger(Number(chain.chainId))
    ) {
      return { error: { code: Code_InvalidParams, message: 'Invalid request' } };
    }

    const dapp = this.getDApp(origin);

    if (Networks.has(chain.chainId)) {
      setTimeout(() => this.wallet_switchEthereumChain(origin, [{ chainId: chain.chainId }]), 200);

      if (Number(dapp?.lastUsedChainId) !== Networks.current.chainId) {
        showMessage({ message: i18n.t('msg-chain-already-exists', { name: chain.chainName || chain.chainId }), type: 'info' });
      }

      return null;
    }

    logInpageRequest({ chainId: Number(chain.chainId) || 0, method: 'addEthereumChain' });

    return new Promise((resolve) => {
      const approve = async () => {
        PubSub.publish(MessageKeys.openLoadingModal);

        if (await Networks.add(chain)) {
          showMessage({ message: i18n.t('msg-chain-added', { name: chain.chainName || chain.chainId }), type: 'success' });
        }

        resolve(null);

        await this.wallet_switchEthereumChain(origin, [{ chainId: chain.chainId }]);
        PubSub.publish(MessageKeys.closeLoadingModal);
      };

      const reject = () => {
        resolve({ error: { code: Code_UserRejected, message: 'The request was rejected by the user' } });
      };

      PubSub.publish(MessageKeys.openAddEthereumChain, {
        approve,
        reject,
        chain: params[0],
      } as InpageDAppAddEthereumChain);
    });
  }

  private async wallet_watchAsset(origin: string, asset: WatchAssetParams) {
    if (!asset?.options?.address || asset?.type?.toUpperCase() !== 'ERC20')
      return { error: { code: Code_InvalidParams, message: 'Invalid request' } };

    const dapp = this.getDApp(origin);

    logInpageRequest({ chainId: Number(dapp?.lastUsedChainId) || 0, method: 'addAsset', asset: asset.options.address });

    return new Promise((resolve) => {
      const approve = async () => {
        const chainId = Number(dapp?.lastUsedChainId || Networks.current.chainId);

        let decimals = 18;

        try {
          const testToken = new ERC20Token({
            contract: asset.options.address,
            chainId,
            owner: dapp?.lastUsedAccount || App.currentAccount!.address,
          });

          const [n, s, d] = await Promise.all([testToken.getName(), testToken.getSymbol(), testToken.getDecimals()]);

          decimals = d;

          if (!n && !s) {
            showMessage({ message: i18n.t('msg-asset-can-not-added'), type: 'warning' });
            resolve({ error: { code: Code_InvalidParams, message: 'Invalid address' } });
            return;
          }
        } catch (error) {
          showMessage({ message: JSON.stringify(error), type: 'warning' });
          return;
        }

        const account = App.allAccounts.find((a) => a.address === dapp?.lastUsedAccount) ?? App.currentAccount;

        const newAsset = new ERC20Token({
          contract: asset.options.address,
          decimals: decimals || asset.options.decimals,
          symbol: asset.options.symbol,
          iconUrl: Array.isArray(asset.options.image) ? asset.options.image[0] : asset.options.image,
          shown: true,
          chainId,
          owner: dapp?.lastUsedAccount || App.currentAccount!.address,
        });

        account?.tokens.addToken(newAsset, chainId);

        showMessage({
          message: account ? i18n.t('msg-token-added', { name: asset.options.symbol }) : i18n.t('msg-account-not-found'),
          type: account ? 'success' : 'warning',
        });

        resolve(null);
      };

      const reject = () => {
        resolve(null);
      };

      PubSub.publish(MessageKeys.openAddAsset, {
        asset,
        approve,
        reject,
      } as InpageDAppAddAsset);
    });
  }

  private async personal_ecRecover(origin: string, params: string[]) {
    const dapp = this.getDApp(origin);
    if (!dapp) return null;

    const [hexMsg, signature] = params;
    const msg = Buffer.from(utils.arrayify(hexMsg)).toString('utf-8');

    const address = utils.verifyMessage(msg, signature);
    return dapp.lastUsedAccount === address ? address : null;
  }

  async setDAppChainId(origin: string, chainId: string | number, from: 'user' | 'inpage' = 'user') {
    const dapp = this.getDApp(origin);
    if (!dapp) return;

    dapp.setLastUsedChain(chainId);

    this.emit(
      'appChainUpdated_metamask',
      {
        origin,
        name: 'metamask-provider',
        data: {
          method: NOTIFICATION_NAMES.chainChanged,
          jsonrpc: '2.0',
          params: { chainId: `0x${Number(chainId).toString(16)}`, networkVersion: `${chainId}` },
        },
      },
      from
    );
  }

  async setDAppAccount(origin: string, account: string) {
    const dapp = this.getDApp(origin);
    if (!dapp) return;

    dapp.setLastUsedAccount(account);

    this.emit('appAccountUpdated_metamask', {
      origin,
      name: 'metamask-provider',
      data: {
        method: NOTIFICATION_NAMES.accountsChanged,
        jsonrpc: '2.0',
        params: [account],
      },
    });
  }
}
