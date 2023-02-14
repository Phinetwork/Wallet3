import Animated, { FadeIn, FadeInDown, FadeInRight, FadeOutDown, FadeOutLeft, FadeOutUp } from 'react-native-reanimated';
import { FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
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
import { calcHorizontalPadding } from '../components/Utils';
import { getScreenCornerRadius } from '../../../utils/hardware';
import i18n from '../../../i18n';
import { observer } from 'mobx-react-lite';

const { View } = Animated;

export default observer(({ vm, onNext }: { vm: ShardsDistributor; onNext: () => void }) => {
  const [marginHorizontal] = useState(calcHorizontalPadding());

  const { t } = i18n;
  const { secondaryTextColor, appColor, thirdTextColor } = Theme;
  const { approvedCount, threshold } = vm;

  return (
    <View
      style={{ flex: 1, position: 'relative' }}
      entering={FadeInRight.delay(500).springify()}
      exiting={FadeOutLeft.springify()}
    >
      <View style={{ flex: 1, marginBottom: 20 }}>
        <View style={{ flex: 1 }} />
        <View style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'baseline', marginStart: -6 }}>
          <Text style={{ fontSize: 96, color: appColor, fontWeight: '600', minWidth: 72, textAlign: 'center' }}>
            {vm.threshold}
          </Text>
          <Text style={{ fontSize: 24, marginStart: 10, marginEnd: 18, color: secondaryTextColor, fontWeight: '300' }}>
            of
          </Text>
          <Text style={{ fontSize: 32, color: appColor, fontWeight: '700', minWidth: 29 }}>{approvedCount + 1}</Text>
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
            maximumValue={approvedCount + 1}
            onValueChange={(v) => vm.setThreshold(v)}
            minimumTrackTintColor={appColor}
          />
          <Text style={{ ...styles.thumbTxt, color: secondaryTextColor }}>{approvedCount + 1}</Text>
        </View>
        <View style={{ flex: 1.5 }} />

        <Text style={{ marginHorizontal, marginTop: 8, color: thirdTextColor, lineHeight: 19 }}>
          {t('multi-sign-create-threshold', { threshold, max: approvedCount + 1 })}
        </Text>
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
