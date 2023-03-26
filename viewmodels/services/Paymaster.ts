import { BigNumber, BigNumberish, Contract, providers, utils } from 'ethers';
import { ITokenMetadata, USDT } from '../../common/tokens';

import { AccountBase } from '../account/AccountBase';
import { ERC20Token } from '../../models/ERC20';
import { IFungibleToken } from '../../models/Interfaces';
import OracleABI from '../../abis/TokenOracle.json';
import { PaymasterAPI } from '@account-abstraction/sdk';
import { UserOperationStruct } from '@account-abstraction/contracts';
import { getHash } from '../../configs/secret';

export class Paymaster extends PaymasterAPI {
  address: string;
  feeToken: IFungibleToken;
  erc20: ERC20Token;
  account: AccountBase;
  oracle: Contract;

  constructor(opts: {
    paymasterAddress: string;
    feeToken: IFungibleToken;
    provider: providers.JsonRpcProvider;
    account: AccountBase;
  }) {
    super();
    this.address = opts.paymasterAddress;
    this.feeToken = opts.feeToken;
    this.account = opts.account;
    this.erc20 = new ERC20Token({ owner: this.address, chainId: 1, contract: this.feeToken.address });
    this.oracle = new Contract(this.address, OracleABI, opts.provider);
  }

  async getTokenAmount(totalGas: BigNumberish, erc20: string) {
    try {
      const erc20Amount: BigNumberish = await this.oracle.getTokenValueOfEth(erc20, totalGas);
      return BigNumber.from(erc20Amount);
    } catch (error) {}
  }

  async getPaymasterAndData(_: Partial<UserOperationStruct>): Promise<string | undefined> {
    const result = utils.solidityPack(
      ['address', 'address', 'bytes'],
      [this.address, this.feeToken.address, await getHash(this.account.address)]
    );

    return result;
  }

  async buildApprove(feeAmount: BigNumberish): Promise<providers.TransactionRequest[]> {
    const requests: providers.TransactionRequest[] = [];

    const allowance = await this.feeToken.allowance(this.account.address, this.address);
    if (allowance.gte(feeAmount)) return [];

    if (this.feeToken.address === USDT.address && allowance.gt(0)) {
      const zero = this.erc20.encodeApproveData(this.address, 0);
      requests.push({ to: this.feeToken.address, data: zero });
    }

    const approve = this.erc20.encodeApproveData(this.address, feeAmount);
    requests.push({ to: this.feeToken.address, data: approve });

    return requests;
  }
}
