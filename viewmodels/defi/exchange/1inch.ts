import { BigNumber, providers, utils } from 'ethers';
import { ETH, IToken } from '../../../common/tokens';
import { SwapProtocol, SwapResponse, fetchTokens, quote, swap } from '../../../common/apis/1inch';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import { swapFeePercent, swapFeeReferrer } from '../../../configs/secret';

import { Account } from '../../account/Account';
import App from '../../core/App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ERC20Token } from '../../../models/ERC20';
import { INetwork } from '../../../common/Networks';
import LINQ from 'linq';
import MessageKeys from '../../../common/MessageKeys';
import { NativeToken } from '../../../models/NativeToken';
import Networks from '../../core/Networks';
import { ReadableInfo } from '../../../models/Transaction';
import { SupportedChains } from './1inchSupportedChains';
import TokensMan from '../../services/TokensMan';
import TxHub from '../../hubs/TxHub';

const Keys = {
  userSelectedNetwork: 'exchange-userSelectedNetwork',
  userSelectedAccount: 'exchange-userSelectedAccount',

  userSelectedFromToken: (chainId: number) => `${chainId}-1inch-from-token`,
  userSelectedToToken: (chainId: number) => `${chainId}-1inch-to-token`,
  userSlippage: (chainId: number) => `${chainId}-1inch-slippage`,
  networkTokens: (chainId: number) => `${chainId}-1inch-tokens-v2`,
};

const app = { name: '1inch Exchange', icon: 'https://1inch.io/img/favicon/apple-touch-icon.png', verified: true };
const V5Router = '0x1111111254EEB25477B68fb85Ed929f73A960582';
const DEV_PROTOCOLS = [
  {
    fromTokenAddress: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
    name: 'POLYGON_SUSHISWAP',
    part: 80,
    toTokenAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  },
  {
    fromTokenAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    name: 'POLYGON_SUSHISWAP',
    part: 20,
    toTokenAddress: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
  },
];

export class OneInch {
  private calcExchangeRateTimer?: NodeJS.Timer;
  private watchPendingTxTimer?: NodeJS.Timer;

  swapResponse: SwapResponse | null = null;
  routes: SwapProtocol[] = [];
  errorMsg = '';

  userSelectedNetwork = Networks.Ethereum;
  account = App.currentAccount!;

  networks = SupportedChains.map((chainId) => {
    return { ...Networks.find(chainId)!, pinned: false };
  });

  tokens: (NativeToken | ERC20Token)[] = [];
  swapFrom: (NativeToken | ERC20Token) | null = null;
  swapTo: (NativeToken | ERC20Token) | null = null;
  swapFromAmount = '';
  swapToAmount: string | null = null;
  calculating = false;
  checkingApproval = false;
  exchangeRate = 0;
  needApproval = true;
  slippage = 0.5;

  pendingTxs: string[] = [];
  tokenSymbols = new Map<string, string>();

  get isValidFromAmount() {
    try {
      const amount = utils.parseUnits(this.swapFromAmount, this.swapFrom?.decimals || 18);
      return amount.gt(0) && amount.lte(this.swapFrom?.balance!);
    } catch (error) {
      return false;
    }
  }

  get isValidOutputAmount() {
    try {
      return utils.parseUnits(this.swapToAmount || '0', this.swapTo?.decimals).gt(0);
    } catch (error) {
      return false;
    }
  }

  get hasRoutes() {
    return this.routes.length > 0;
  }

  get isPending() {
    return TxHub.pendingTxs
      .filter((t) => this.pendingTxs.includes(t.hash))
      .some((tx) => tx.from === this.account.address && tx.chainId === this.userSelectedNetwork.chainId);
  }

  constructor() {
    makeObservable(this, {
      userSelectedNetwork: observable,
      networks: observable,
      tokens: observable,
      swapFrom: observable,
      swapTo: observable,
      account: observable,
      swapFromAmount: observable,
      swapToAmount: observable,
      exchangeRate: observable,
      calculating: observable,
      checkingApproval: observable,
      needApproval: observable,
      slippage: observable,
      pendingTxs: observable,
      swapResponse: observable,
      errorMsg: observable,
      routes: observable,

      hasRoutes: computed,
      isPending: computed,

      switchNetwork: action,
      switchAccount: action,
      switchSwapFrom: action,
      switchSwapTo: action,
      setSwapAmount: action,
      setSlippage: action,
      enqueueTx: action,
      addToken: action,
    });
  }

  async init() {
    const chainId = Number((await AsyncStorage.getItem(Keys.userSelectedNetwork)) || 1);
    const slippage = Number(await AsyncStorage.getItem(Keys.userSlippage(chainId))) || 0.5;
    const defaultAccount =
      App.findAccount((await AsyncStorage.getItem(Keys.userSelectedAccount)) as string) || App.currentAccount;

    runInAction(() => {
      this.switchAccount(defaultAccount!);
      this.switchNetwork(Networks.find(chainId)!);
      this.slippage = slippage;
    });
  }

  async switchAccount(account: Account | string) {
    this.account =
      typeof account === 'string' ? (App.findAccount(account) as Account) : (account as Account) || App.currentAccount;

    AsyncStorage.setItem(Keys.userSelectedAccount, this.account.address);

    this.tokens.forEach((t, i) => {
      t.setOwner(this.account.address);
      i < 10 ? t.getBalance() : null;
    });
  }

  async switchNetwork(network: INetwork) {
    this.userSelectedNetwork = network;
    this.tokens = [];
    this.swapFrom = null;
    this.swapTo = null;

    AsyncStorage.setItem(Keys.userSelectedNetwork, `${network.chainId}`);

    let allTokens = JSON.parse((await AsyncStorage.getItem(Keys.networkTokens(network.chainId))) || '[]') as IToken[];
    const userTokens = await TokensMan.loadUserTokens(this.userSelectedNetwork.chainId, this.account.address);

    if (allTokens.length === 0) {
      const networkTokens = await fetchTokens(network.chainId);
      allTokens = networkTokens;
      await AsyncStorage.setItem(Keys.networkTokens(network.chainId), JSON.stringify(networkTokens));
    }

    const nativeToken = new NativeToken({ owner: this.account.address, chainId: network.chainId, symbol: network.symbol });
    this.tokenSymbols.set(ETH.address, nativeToken.symbol);

    const all = LINQ.from(
      userTokens.concat(
        allTokens.map((t) => {
          this.tokenSymbols.set(t.address, t.symbol);

          return new ERC20Token({
            chainId: network.chainId,
            owner: this.account.address,
            contract: t.address,
            symbol: t.symbol,
            decimals: t.decimals,
          });
        })
      )
    )
      .distinct((t) => t.address)
      .toArray();

    const tokens = [nativeToken, ...all];

    tokens.slice(0, 10).every((t) => t.getBalance());

    const swapFromAddress = await AsyncStorage.getItem(Keys.userSelectedFromToken(network.chainId));
    const fromToken = tokens.find((t) => t.address === swapFromAddress) || tokens[0];

    const swapToAddress = await AsyncStorage.getItem(Keys.userSelectedToToken(network.chainId));
    const toToken = tokens.find((t) => t.address === swapToAddress) || tokens.find((t) => t.address !== fromToken.address)!;

    runInAction(() => {
      this.tokens = tokens;
      this.swapResponse = null;
      this.errorMsg = '';
      this.routes = [];

      this.switchSwapFrom(fromToken, false);
      this.switchSwapTo(toToken, false);
    });
  }

  switchSwapFrom(token: ERC20Token | NativeToken, checkToken = true) {
    if (!token) return;
    if (checkToken && token.address === this.swapTo?.address) {
      this.switchSwapTo(this.swapFrom!, false);
    }

    this.swapFrom = token;
    this.swapFrom.getBalance();
    this.exchangeRate = 0;
    this.checkingApproval = true;

    if (token.address) {
      this.checkApproval(true);
    } else {
      this.checkingApproval = false;
      this.needApproval = false;
    }

    this.setSwapAmount(this.swapFromAmount);
    AsyncStorage.setItem(Keys.userSelectedFromToken(this.userSelectedNetwork.chainId), token.address);
  }

  switchSwapTo(token: ERC20Token | NativeToken, checkToken = true) {
    if (!token) return;
    if (checkToken && token.address === this.swapFrom?.address) {
      this.switchSwapFrom(this.swapTo!, false);
    }

    this.swapTo = token;
    this.exchangeRate = 0;

    this.setSwapAmount(this.swapFromAmount);
    AsyncStorage.setItem(Keys.userSelectedToToken(this.userSelectedNetwork.chainId), token.address);
  }

  private clearSwapAmount() {
    runInAction(() => {
      this.swapFromAmount = '';
      this.swapToAmount = '';
      this.exchangeRate = 0;
    });
  }

  async setSwapAmount(amount: string) {
    clearTimeout(this.calcExchangeRateTimer);
    this.swapFromAmount = amount;
    this.exchangeRate = 0;

    if (!amount) {
      this.swapToAmount = '';
      return;
    }

    if (!Number(amount)) return;

    if (!this.swapFrom?.address && this.swapFrom?.balance.eq(utils.parseEther(amount))) {
      this.swapFromAmount = `${Number(amount) * 0.95}`;
    }

    this.calculating = true;
    this.swapResponse = null;
    this.routes = [];

    this.calcExchangeRateTimer = setTimeout(() => this.calcExchangeRate(), 500);
  }

  setSlippage(amount: number) {
    amount = Math.min(Math.max(0, amount), 50) || 0;
    this.slippage = amount;
    this.swapResponse = null;

    AsyncStorage.setItem(Keys.userSlippage(this.userSelectedNetwork.chainId), `${amount}`);
  }

  protected get requestParams() {
    const fromAmount = utils.parseUnits(this.swapFromAmount, this.swapFrom?.decimals || 18);

    return {
      fromTokenAddress: this.swapFrom?.address || ETH.address,
      toTokenAddress: this.swapTo?.address || ETH.address,
      amount: fromAmount.toString(),
      fee: swapFeePercent,
      referrerAddress: swapFeeReferrer,
      fromAddress: this.account.address,
      slippage: this.slippage,
    };
  }

  async calcExchangeRate() {
    runInAction(() => (this.calculating = true));

    try {
      const params = this.requestParams;
      const [swapOutput, quoteOutput] = await Promise.all([
        this.swapFrom?.balance.gte(params.amount) ? swap(this.userSelectedNetwork.chainId, params) : null,
        quote(this.userSelectedNetwork.chainId, params),
      ]);

      const routes = quoteOutput?.protocols?.flat(99) || [];
      routes.every((p) => {
        p.fromTokenAddress = utils.getAddress(p.fromTokenAddress);
        p.toTokenAddress = utils.getAddress(p.toTokenAddress);
      });

      runInAction(() => {
        this.routes = routes;
        this.swapResponse = swapOutput || null;
        this.errorMsg = swapOutput?.description || '';
        this.swapToAmount = utils.formatUnits(quoteOutput?.toTokenAmount || '0', this.swapTo?.decimals || 18);
        this.exchangeRate = Number(this.swapToAmount || 0) / Number(this.swapFromAmount);
      });
    } catch (e) {
      runInAction(() => {
        this.swapToAmount = '';
        this.exchangeRate = 0;
      });
    } finally {
      runInAction(() => (this.calculating = false));
      setTimeout(() => this.checkApproval(true), 10);
    }

    if (!Number(this.swapFromAmount)) return;
    this.calcExchangeRateTimer = setTimeout(() => this.calcExchangeRate(), 45 * 10000);
  }

  private async checkApproval(force = false) {
    const approved = await (this.swapFrom as ERC20Token)?.allowance?.(this.account.address, V5Router, force);
    if (!approved) return;

    runInAction(() => {
      this.needApproval = approved.lt(utils.parseUnits(this.swapFromAmount || '0', this.swapFrom?.decimals));
      this.checkingApproval = false;
    });
  }

  approve() {
    let data = '0x';

    try {
      data = (this.swapFrom as ERC20Token).encodeApproveData(
        V5Router,
        utils.parseUnits(this.swapFromAmount, this.swapFrom!.decimals)
      );
    } catch (error) {
      return;
    }

    const approve = async (opts: { pin: string; tx: providers.TransactionRequest; readableInfo: ReadableInfo }) => {
      const { txHash } = await App.sendTxFromAccount(this.account.address, opts);

      if (txHash) {
        runInAction(() => {
          this.enqueueTx(txHash);
        });
      }

      return txHash ? true : false;
    };

    const reject = () => {};

    PubSub.publish(MessageKeys.openInpageDAppSendTransaction, {
      approve,
      reject,
      param: { from: this.account.address, to: this.swapFrom!.address, data },
      chainId: this.userSelectedNetwork.chainId,
      account: this.account.address,
      app,
    });
  }

  async swap() {
    if (!this.isValidFromAmount) return;

    let swapResponse = this.swapResponse;

    if (!swapResponse || !swapResponse.tx) {
      swapResponse = (await swap(this.userSelectedNetwork.chainId, this.requestParams)) || null;

      if (!swapResponse || !swapResponse.tx || swapResponse?.error) {
        runInAction(() => (this.errorMsg = swapResponse?.description || 'Service is not available'));
        return;
      }

      runInAction(() => {
        this.swapResponse = swapResponse;
        this.swapToAmount = utils.formatUnits(swapResponse?.toTokenAmount || '0', this.swapTo?.decimals || 18);
      });
    }

    const approve = async (opts: { pin: string; tx: providers.TransactionRequest; readableInfo: ReadableInfo }) => {
      const { txHash } = await App.sendTxFromAccount(this.account.address, opts);
      const result = txHash ? true : false;

      if (result) {
        runInAction(() => {
          this.enqueueTx(txHash!);
          this.clearSwapAmount();
        });
      }

      return result;
    };

    const reject = () => {};

    PubSub.publish(MessageKeys.openInpageDAppSendTransaction, {
      approve,
      reject,
      param: {
        from: this.account.address,
        to: swapResponse!.tx.to,
        data: swapResponse!.tx.data,
        value: swapResponse!.tx.value,
      },
      chainId: this.userSelectedNetwork.chainId,
      account: this.account.address,
      app,
    });
  }

  enqueueTx(hash: string) {
    this.pendingTxs.push(hash);
    clearTimeout(this.watchPendingTxTimer);
    this.watchPendingTxTimer = setTimeout(() => this.watchPendingTxs(), 1000);
  }

  private watchPendingTxs() {
    const pendingTxs = this.pendingTxs.filter((tx) => TxHub.pendingTxs.find((t) => t.hash === tx));

    if (pendingTxs.length < this.pendingTxs.length) {
      this.checkApproval(true);
      this.swapFrom?.getBalance();
      this.swapTo?.getBalance();
    }

    runInAction(() => (this.pendingTxs = pendingTxs));

    if (pendingTxs.length === 0) return;
    this.watchPendingTxTimer = setTimeout(() => this.watchPendingTxs(), 1000);
  }

  addToken(token: ERC20Token) {
    if (token.chainId !== this.userSelectedNetwork.chainId) return;
    if (this.tokens.find((t) => t.address === token.address)) return;

    token.setOwner(this.account.address);
    token.getBalance();
    this.tokens.unshift(token);

    const data = JSON.stringify(
      this.tokens
        .filter((t) => t.address)
        .map((t) => {
          return { address: t.address, decimals: t.decimals, symbol: t.symbol };
        })
    );

    AsyncStorage.setItem(Keys.networkTokens(this.userSelectedNetwork.chainId), data);
  }
}

export default new OneInch();
