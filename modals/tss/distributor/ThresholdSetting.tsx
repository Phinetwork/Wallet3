import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeOutDown,
  FadeOutLeft,
  FadeOutRight,
  FadeOutUp,
} from 'react-native-reanimated';
import { FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, Octicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { secureColor, warningColor } from '../../../constants/styles';

import Button from '../components/Button';
import { ClientInfo } from '../../../common/p2p/Constants';
import Device from '../../../components/Device';
import DeviceInfo from '../components/DeviceInfo';
import { Passpad } from '../../views';
import { ShardsDistributor } from '../../../viewmodels/tss/ShardsDistributor';
import Slider from '@react-native-community/slider';
import { TCPClient } from '../../../common/p2p/TCPClient';
import Theme from '../../../viewmodels/settings/Theme';
import { getScreenCornerRadius } from '../../../utils/hardware';
import i18n from '../../../i18n';
import { observer } from 'mobx-react-lite';
import { startLayoutAnimation } from '../../../utils/animations';
import { useHorizontalPadding } from '../components/Utils';

const { View, Text } = Animated;

export default observer(({ vm, onNext, isRTL }: { vm: ShardsDistributor; onNext: () => void; isRTL?: boolean }) => {
  const marginHorizontal = useHorizontalPadding();

  const { t } = i18n;
  const { secondaryTextColor, appColor, thirdTextColor } = Theme;
  const { approvedCount, threshold, totalCount, thresholdTooHigh } = vm;

  useEffect(() => startLayoutAnimation(), [thresholdTooHigh]);

  return (
    <View
      style={{ flex: 1, position: 'relative' }}
      entering={isRTL ? FadeInLeft.delay(300).springify() : FadeInRight.delay(300).springify()}
      exiting={isRTL ? FadeOutRight.springify() : FadeOutLeft.springify()}
    >
      <View style={{ flex: 1, marginBottom: 16 }}>
        <View style={{ flex: 1 }} />
        <View style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'baseline', marginStart: -6 }}>
          <Text style={{ fontSize: 96, color: appColor, fontWeight: '600', minWidth: 72, textAlign: 'center' }}>
            {vm.threshold}
          </Text>
          <Text style={{ fontSize: 24, marginStart: 10, marginEnd: 18, color: secondaryTextColor, fontWeight: '300' }}>
            of
          </Text>
          <Text style={{ fontSize: 32, color: appColor, fontWeight: '700', minWidth: 29 }}>{totalCount}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal }}>
          <Text style={{ ...styles.thumbTxt, color: secondaryTextColor }}>2</Text>
          <Slider
            tapToSeek
            step={1}
            value={threshold}
            style={{ flex: 1, marginHorizontal: 12 }}
            minimumValue={approvedCount <= 1 ? 1 : 2}
            disabled={approvedCount <= 1}
            maximumValue={totalCount}
            onValueChange={(v) => vm.setThreshold(v)}
            minimumTrackTintColor={appColor}
          />
          <Text style={{ ...styles.thumbTxt, color: secondaryTextColor }}>{totalCount}</Text>
        </View>

        <View style={{ flex: 1.5 }} />

        <Text style={{ marginHorizontal, marginTop: 8, color: thirdTextColor, lineHeight: 19, fontWeight: '500' }}>
          {t('multi-sig-modal-create-threshold', { threshold, max: totalCount })}
        </Text>
        
        {thresholdTooHigh && (
          <Text
            entering={FadeInDown.springify()}
            exiting={FadeOutUp.springify()}
            style={{ color: warningColor, fontSize: 12.5, fontWeight: '500', marginHorizontal, marginTop: 8 }}
          >
            <Ionicons name="warning" size={14} />
            {`  ${t('multi-sig-modal-msg-threshold-too-high')}`}
          </Text>
        )}
      </View>

      <Button onPress={onNext} disabled={approvedCount === 0 || threshold < 2} title={t('button-next')} />
    </View>
  );
});

const styles = StyleSheet.create({
  thumbTxt: {
    fontSize: 16,
    fontWeight: '500',
  },
});
