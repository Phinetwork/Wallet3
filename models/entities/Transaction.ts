import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';
import { BigNumberish, providers } from 'ethers';

@Entity({ name: 'transactions' })
export default class Transaction extends BaseEntity {
  @PrimaryColumn()
  hash!: string;

  @Column()
  chainId!: number;

  @Column()
  from!: string;

  @Column()
  to!: string;

  @Column()
  value!: string;

  @Column()
  gas!: number;

  @Column()
  gasPrice!: number;

  @Column({ default: 0 })
  priorityPrice!: number;

  @Column()
  nonce!: number;

  @Column({ type: 'text', default: '' })
  data!: string;

  @Column()
  timestamp!: number;

  @Column({ nullable: true })
  blockNumber?: number;

  @Column({ nullable: true })
  blockHash?: string;

  @Column({ nullable: true })
  status?: boolean;

  @Column({ nullable: true })
  transactionIndex?: number;

  @Column({ nullable: true })
  gasUsed?: number;

  @Column({ nullable: true, type: 'simple-json' })
  readableInfo!: ReadableInfo;

  get isERC4337() {
    return false;
  }
}

interface TransferInfo {
  symbol?: string;
  recipient?: string;
  amountWei?: string;
  decimals?: number;
  amount?: string;
  nft?: string;
}

interface DAppInteraction {
  dapp: string;
  icon?: string;
}

interface ExtraInfo {
  decodedFunc?: string;
  cancelTx?: boolean;
}

export type ReadableInfo = Partial<
  { type: 'transfer' | 'transfer-nft' | 'dapp-interaction' | 'batchTx'; readableTxt?: string } & ExtraInfo &
    TransferInfo &
    DAppInteraction
>;

export interface ITransaction extends providers.TransactionRequest {
  hash?: string;

  chainId?: number;

  timestamp?: number;

  blockNumber?: number;

  blockHash?: string;

  status?: boolean;

  gasUsed?: number;

  readableInfo?: ReadableInfo;
}
