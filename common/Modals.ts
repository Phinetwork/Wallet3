import { IShardsDistributorConstruction, ShardsDistributor } from '../viewmodels/tss/ShardsDistributor';

import { Authentication } from '../viewmodels/auth/Authentication';
import { KeyRecoveryRequestor } from '../viewmodels/tss/KeyRecoveryRequestor';
import MessageKeys from './MessageKeys';
import { MultiSigKeyDeviceInfo } from '../models/entities/MultiSigKey';
import { PairedDevice } from '../viewmodels/tss/management/PairedDevice';
import { Service } from 'react-native-zeroconf';
import { ShardProvider } from '../viewmodels/tss/ShardProvider';
import { ShardsAggregator } from '../viewmodels/tss/ShardsAggregator';
import i18n from '../i18n';
import { showMessage } from 'react-native-flash-message';

export async function openGlobalPasspad(req: {
  passLength?: number;
  closeOnOverlayTap?: boolean;
  onAutoAuthRequest?: () => Promise<boolean>;
  onPinEntered: (pin: string) => Promise<boolean>;
  authentication: Authentication;
}) {
  const { authentication } = req;
  const { pinSet, biometricEnabled, biometricSupported } = authentication;

  if (!pinSet) {
    if (!biometricSupported) {
      showMessage({ message: i18n.t('msg-please-enable-biometric'), type: 'info' });
      return false;
    } else {
      !biometricEnabled && (await authentication.setBiometrics(true));
    }
  }

  const fast = biometricEnabled;
  const fastOnly = !pinSet && biometricEnabled;

  if ((fast || fastOnly) && (await req.onAutoAuthRequest?.())) {
    return true;
  }

  if (fastOnly || !pinSet) {
    showMessage({ message: i18n.t('msg-please-enable-biometric'), type: 'info' });
    return false;
  }

  return new Promise<boolean>((resolve) => {
    let handled = false;

    const onAutoAuthHook = async () => {
      const success = (await req.onAutoAuthRequest?.()) ?? false;
      success && resolve(success);
      handled = success;
      return success;
    };

    const onPinEnteredHook = async (pin: string) => {
      const success = await req.onPinEntered(pin);
      success && resolve(success);
      handled = success;
      return success;
    };

    const onClosedHook = () => {
      if (!handled) resolve(false);
    };

    PubSub.publish(MessageKeys.openGlobalPasspad, {
      closeOnOverlayTap: true,
      ...req,
      onPinEntered: onPinEnteredHook,
      onAutoAuthRequest: fast || fastOnly ? undefined : req.onAutoAuthRequest ? onAutoAuthHook : undefined, // override requests onAutoAuthRequest
      onClosed: onClosedHook,
    });
  });
}

export function openShardsDistributors(
  args: (IShardsDistributorConstruction | { vm: ShardsDistributor }) & { onClosed?: () => void }
) {
  const vm: ShardsDistributor = args['vm'] ?? new ShardsDistributor(args as IShardsDistributorConstruction);
  PubSub.publish(MessageKeys.openShardsDistribution, { vm, ...args });
}

export function openShardsAggregator(args: { vm: ShardsAggregator; onClosed?: () => void }) {
  PubSub.publish(MessageKeys.openShardsAggregator, args);
}

export function openShardProvider(args: { vm: ShardProvider; onClosed?: () => void }) {
  PubSub.publish(MessageKeys.openShardProvider, args);
}

export function openShardReceiver() {
  PubSub.publish(MessageKeys.openShardReceiver);
}

export function openKeyRecoveryRequestor(args: { vm: KeyRecoveryRequestor; onClosed?: () => void }) {
  PubSub.publish(MessageKeys.openKeyRecoveryRequestor, args);
}

export function openKeyRecoveryProvider(args: { service: Service; onClosed?: () => void }) {
  PubSub.publish(MessageKeys.openKeyRecoveryProvider, args);
}

export function openShardRedistributionReceiver(args: { device: PairedDevice; service: Service; onClosed?: () => void }) {
  PubSub.publish(MessageKeys.openShardRedistributionReceiver, args);
}

export function openInactiveDevicesTip(args: { devices: MultiSigKeyDeviceInfo[] }) {
  PubSub.publish(MessageKeys.openInactiveDevicesTip, args);
}
