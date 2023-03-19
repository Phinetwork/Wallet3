import * as Crypto from 'expo-crypto';

import { createCipheriv, createDecipheriv, createECDH, createHash, randomBytes } from 'crypto';
import { getSecureRandomBytes, randomInt } from '../../utils/math';

import { AsyncTCPSocket } from './AsyncTCPSocket';
import { CipherAlgorithm } from './Constants';
import EventEmitter from 'eventemitter3';
import TCP from 'react-native-tcp-socket';
import { TCPClient } from './TCPClient';
import { sleep } from '../../utils/async';

const { Server } = TCP;

export abstract class TCPServer<T extends EventEmitter.ValidEventTypes> extends EventEmitter<T, any> {
  private readonly server: TCP.Server;
  private handshakingSockets = new Set<AsyncTCPSocket>();

  constructor() {
    super();
    this.server = new Server(this.handleClient);
    this.server.once('error', () => this.stop());
  }

  get port() {
    return this.server.address()?.port;
  }

  get address() {
    return this.server.address()?.address;
  }

  get listening() {
    return this.server.listening;
  }

  async start() {
    if (this.listening) return true;
    let attempts = 0;

    while (attempts < 10) {
      try {
        await new Promise<void>((resolve) =>
          this.server.listen({ port: randomInt(10000, 60000), host: '0.0.0.0' }, () => resolve())
        );
        break;
      } catch (error) {
        __DEV__ && console.error(error);
        attempts++;
      }
    }

    return attempts < 10;
  }

  stop() {
    this.handshakingSockets.forEach((s) => {
      s.destroy();
      s.removeAllListeners();
    });

    this.handshakingSockets.clear();
    this.server.removeAllListeners();

    if (!this.listening) return;

    return new Promise<void>((resolve) => {
      this.server.close((err) => {
        __DEV__ && err && console.error(`tcp server close err: ${err.name} ${err.message}`);
        resolve();
      });
    });
  }

  private handleClient = async (c: TCP.Socket | TCP.TLSSocket) => {
    const socket = new AsyncTCPSocket(c);
    this.handshakingSockets.add(socket);

    try {
      const client = await this.handshake(socket);

      if (client) {
        while (!client.greeted) {
          await sleep(500);
        }

        this.newClient(client);
      } else {
        socket.destroy();
        return;
      }
    } finally {
      this.handshakingSockets.delete(socket);
    }
  };

  private handshake = async (socket: AsyncTCPSocket): Promise<TCPClient | undefined> => {
    try {
      const iv = getSecureRandomBytes(16);
      const ecdh = createECDH('secp256k1');

      await socket.write(Buffer.from([...iv, ...ecdh.generateKeys()]));
      const negotiation = (await socket.read())!;

      const civ = negotiation.subarray(0, 16);
      const negotiationKey = negotiation.subarray(16);

      const secret = ecdh.computeSecret(negotiationKey);
      const pairingCode = `${secret.reduce((p, c) => p * BigInt(c || 1), BigInt(1))}`.substring(6, 10);

      const cipher = createCipheriv(CipherAlgorithm, createHash('sha256').update(secret).digest(), iv);
      const decipher = createDecipheriv(CipherAlgorithm, secret, civ);

      return new TCPClient({ cipher, decipher, socket: socket.raw, pairingCode });
    } catch (error) {
      __DEV__ && console.error(error);
    }
  };

  protected abstract newClient(_: TCPClient): void;
}
