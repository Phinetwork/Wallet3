import * as Random from 'expo-random';
import * as SecureStore from 'expo-secure-store';

import {
  AuthenticationType,
  LocalAuthenticationOptions,
  authenticateAsync,
  hasHardwareAsync,
  isEnrolledAsync,
  supportedAuthenticationTypesAsync,
} from 'expo-local-authentication';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import { appEncryptKey, pinEncryptKey } from '../../configs/secret';
import { decrypt, encrypt, sha256 } from '../../utils/cipher';

import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventEmitter from 'events';
import MessageKeys from '../../common/MessageKeys';
import { toMilliseconds } from '../../utils/time';

const keys = {
  enableBiometrics: 'enableBiometrics',
  userSecretsVerified: 'userSecretsVerified',
  masterKey: 'masterKey',
  pin: 'pin',
  appUnlockTime: 'appUnlockTime',
};

export type BioType = 'faceid' | 'fingerprint' | 'iris';

export class Authentication extends EventEmitter {
  private lastBackgroundTimestamp = Date.now();

  biometricSupported = false;
  supportedTypes: AuthenticationType[] = [];
  biometricEnabled = true;

  appAuthorized = false;
  userSecretsVerified = false;

  failedAttempts = 0;
  appUnlockTime = 0;

  get appAvailable() {
    return Date.now() > this.appUnlockTime;
  }

  get biometricType(): BioType | undefined {
    if (!this.biometricSupported || !this.biometricEnabled) return undefined;

    switch (this.supportedTypes[0]) {
      case AuthenticationType.FINGERPRINT:
        return 'fingerprint';
      case AuthenticationType.FACIAL_RECOGNITION:
        return 'faceid';
      case AuthenticationType.IRIS:
        return 'iris';
      default:
        return undefined;
    }
  }

  constructor() {
    super();

    makeObservable(this, {
      biometricSupported: observable,
      supportedTypes: observable,
      biometricEnabled: observable,
      appAuthorized: observable,
      userSecretsVerified: observable,
      failedAttempts: observable,
      appUnlockTime: observable,
      appAvailable: computed,
      setBiometrics: action,
      reset: action,
      setUserSecretsVerified: action,
    });

    this.init();

    AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        this.lastBackgroundTimestamp = Date.now();
        return;
      }

      if (nextState === 'active') {
        if (Date.now() - this.lastBackgroundTimestamp < 1000 * 60 * 2) return;
        if (!this.appAuthorized) return;

        runInAction(() => {
          this.appAuthorized = false;
          this.failedAttempts = 0;
        });
      }
    });
  }

  async init() {
    const [supported, enrolled, supportedTypes, enableBiometrics, userSecretsVerified, appUnlockTime] = await Promise.all([
      hasHardwareAsync(),
      isEnrolledAsync(),
      supportedAuthenticationTypesAsync(),
      AsyncStorage.getItem(keys.enableBiometrics),
      AsyncStorage.getItem(keys.userSecretsVerified),
      AsyncStorage.getItem(keys.appUnlockTime),
    ]);

    runInAction(() => {
      this.biometricSupported = supported && enrolled;
      this.supportedTypes = supportedTypes;
      this.biometricEnabled = enableBiometrics === 'true';
      this.userSecretsVerified = userSecretsVerified === 'true';
      this.appUnlockTime = Number(appUnlockTime) || 0;
    });
  }

  private async authenticate({ pin, options }: { pin?: string; options?: LocalAuthenticationOptions } = {}): Promise<boolean> {
    if (pin) return await this.verifyPin(pin);
    if (!this.biometricSupported) return false;

    const { success } = await authenticateAsync(options);
    return success;
  }

  private async getMasterKey() {
    let masterKey = await SecureStore.getItemAsync(keys.masterKey);

    if (!masterKey) {
      masterKey = Buffer.from(Random.getRandomBytes(16)).toString('hex');
      await SecureStore.setItemAsync(keys.masterKey, masterKey);
    }

    return `${masterKey}_${appEncryptKey}`;
  }

  async setBiometrics(enabled: boolean) {
    if (enabled) {
      if (!(await this.authenticate())) return;
    }

    runInAction(() => (this.biometricEnabled = enabled));
    AsyncStorage.setItem(keys.enableBiometrics, enabled.toString());
  }

  async setupPin(pin: string) {
    await SecureStore.setItemAsync(keys.pin, await sha256(`${pin}_${pinEncryptKey}`));
  }

  async verifyPin(pin: string) {
    const success = (await sha256(`${pin}_${pinEncryptKey}`)) === (await SecureStore.getItemAsync(keys.pin));

    runInAction(() => {
      this.failedAttempts = success ? 0 : this.failedAttempts + 1;
      if (this.failedAttempts <= (__DEV__ ? 3 : 6)) return;

      this.failedAttempts = 0;
      this.appUnlockTime = Date.now() + (__DEV__ ? toMilliseconds({ seconds: 120 }) : toMilliseconds({ hours: 3 }));
      AsyncStorage.setItem(keys.appUnlockTime, this.appUnlockTime.toString());
    });

    return success;
  }

  async authorize(pin?: string) {
    const success = await this.authenticate({ pin });

    if (!this.appAuthorized) {
      runInAction(() => (this.appAuthorized = success));

      if (success) {
        this.emit('appAuthorized');
        if (!this.userSecretsVerified) PubSub.publish(MessageKeys.userSecretsNotVerified);
      }
    }

    return success;
  }

  async encrypt(data: string) {
    return encrypt(data, await this.getMasterKey());
  }

  async decrypt(data: string, pin?: string) {
    if (!(await this.authenticate({ pin }))) return undefined;
    return decrypt(data, await this.getMasterKey());
  }

  setUserSecretsVerified(verified: boolean) {
    this.userSecretsVerified = verified;
    AsyncStorage.setItem(keys.userSecretsVerified, verified.toString());
  }

  reset() {
    this.appAuthorized = false;
    this.userSecretsVerified = false;
    this.biometricEnabled = false;
    return SecureStore.deleteItemAsync(keys.masterKey);
  }
}

export default new Authentication();
