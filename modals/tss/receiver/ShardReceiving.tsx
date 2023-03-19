import Animated, { FadeInRight, FadeOutLeft, FadeOutUp } from 'react-native-reanimated';
import { FadeInLeftView, FadeInUpView, ZoomInView } from '../../../components/animations';
import React, { useEffect, useState } from 'react';
import { ShardPersistentStatus, ShardReceiver } from '../../../viewmodels/tss/ShardReceiver';
import { getDeviceModel, useOptimizedSafeBottom } from '../../../utils/hardware';
import { secureColor, warningColor } from '../../../constants/styles';

import Device from '../../../components/Device';
import DeviceRipple from '../components/DeviceRipple';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { Placeholder } from '../../../components';
import { SECOND } from '../../../utils/time';
import Theme from '../../../viewmodels/settings/Theme';
import deviceInfoModule from 'react-native-device-info';
import i18n from '../../../i18n';
import { observer } from 'mobx-react-lite';

const { View, Text, FlatList } = Animated;

interface Props {
  vm: ShardReceiver;
  close: () => void;
  onCritical: (critical: boolean) => void;
}

export default observer(({ vm, close, onCritical }: Props) => {
  const { t } = i18n;
  const { secondaryTextColor, textColor, borderColor } = Theme;
  const { pairingCodeVerified, secretStatus, pairingCode } = vm;
  const [dataVerified, setDataVerified] = useState<boolean | undefined>(undefined);
  const safeBottom = useOptimizedSafeBottom();

  useEffect(() => {
    vm.once('dataVerified' as any, () => setDataVerified(true));
    vm.once('dataVerifyFailed' as any, () => setDataVerified(false));
  }, []);

  useEffect(() => {
    if (!dataVerified) return;

    const timer = setTimeout(close, 10 * SECOND);
    return () => clearTimeout(timer);
  }, [dataVerified]);

  useEffect(() => onCritical(secretStatus === ShardPersistentStatus.verifying), [secretStatus]);

  const devTxtStyle: any = { color: secondaryTextColor, fontSize: 16, maxWidth: '90%', fontWeight: '500' };

  interface ICompletedBarProps {
    txt: string;
    tintColor?: string;
    delay?: number;
    succeed: boolean;
  }

  const renderCompletedBar = ({ txt, tintColor, delay, succeed }: ICompletedBarProps) => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
        <ZoomInView duration={200} delay={delay} style={{ width: 32, alignItems: 'center' }}>
          <Ionicons
            name={succeed ? 'checkmark-circle' : 'warning'}
            color={tintColor ?? borderColor}
            size={succeed ? 32 : 30}
          />
        </ZoomInView>
        <FadeInLeftView
          delay={300 + (delay ?? 0)}
          style={{
            borderRadius: 20,
            height: 28,
            marginStart: 10,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', color: tintColor ?? secondaryTextColor }}>{txt}</Text>
        </FadeInLeftView>
      </View>
    );
  };

  return (
    <View
      style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 0 }}
      entering={FadeInRight.delay(300).springify()}
      exiting={FadeOutLeft.springify()}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {!pairingCodeVerified && (
          <View style={{ alignItems: 'center', marginTop: -24 }} exiting={FadeOutUp.springify()}>
            <Text
              style={{
                color: secondaryTextColor,
                marginBottom: 8,
                fontSize: 12.5,
                fontWeight: '500',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              {`${t('multi-sig-modal-txt-pairing-code')}`}
            </Text>
            <Text style={{ color: textColor, fontSize: 42, fontWeight: '800' }}>{pairingCode}</Text>
          </View>
        )}

        {pairingCodeVerified && secretStatus === ShardPersistentStatus.waiting && (
          <DeviceRipple deviceId={vm.remoteInfo!.device} os={vm.remoteInfo!.rn_os} />
        )}

        {pairingCodeVerified && secretStatus !== ShardPersistentStatus.waiting && (
          <FadeInUpView delay={200} style={{ position: 'relative', minWidth: 160 }}>
            {secretStatus === ShardPersistentStatus.verifying &&
              dataVerified === undefined &&
              renderCompletedBar({ delay: 300, txt: t('multi-sig-modal-txt-data-verifying'), succeed: true })}

            {dataVerified &&
              renderCompletedBar({ tintColor: secureColor, txt: t('multi-sig-modal-txt-data-verified'), succeed: true })}
            {dataVerified === false &&
              renderCompletedBar({
                tintColor: warningColor,
                txt: t('multi-sig-modal-txt-data-verifying-failed'),
                succeed: false,
              })}

            {secretStatus === ShardPersistentStatus.saved &&
              renderCompletedBar({ txt: t('multi-sig-modal-txt-data-saved'), tintColor: secureColor, succeed: true })}
            {secretStatus === ShardPersistentStatus.saveFailed &&
              renderCompletedBar({
                txt: t('multi-sig-modal-txt-data-saving-failed'),
                tintColor: warningColor,
                succeed: false,
              })}
          </FadeInUpView>
        )}
      </View>

      <View style={{ flexDirection: 'row', paddingBottom: safeBottom }}>
        <Device os={'ios'} deviceId={deviceInfoModule.getDeviceId()} style={{ width: 48, height: 72 }} />
        <View
          style={{
            marginStart: 4,
            padding: 8,
            paddingVertical: 0,
            overflow: 'hidden',
            justifyContent: 'space-around',
            flex: 1,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ ...devTxtStyle, maxWidth: '64%', flexGrow: 0 }} numberOfLines={1}>
              {`${t('multi-sig-modal-txt-device-name')}: ${deviceInfoModule.getDeviceNameSync()}`}
            </Text>

            <View
              style={{
                borderRadius: 5,
                backgroundColor: vm.closed ? warningColor : secureColor,
                alignItems: 'center',
                justifyContent: 'center',
                marginStart: 8,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginVertical: -3,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500', textTransform: 'capitalize' }} numberOfLines={1}>
                {vm.closed ? t('msg-disconnected') : t('msg-connected')}
              </Text>
            </View>
          </View>
          <Placeholder />
          <Text style={devTxtStyle} numberOfLines={1}>{`${t('multi-sig-modal-txt-device-model')}: ${getDeviceModel()}`}</Text>
          <Placeholder />
          <Text style={devTxtStyle} numberOfLines={1}>
            {`${deviceInfoModule.getSystemName()} ${deviceInfoModule.getSystemVersion()}`}
          </Text>
        </View>
      </View>
    </View>
  );
});
