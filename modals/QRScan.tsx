import React, { useEffect, useState } from 'react';
import Scanner, { BarCodeScanningResult } from '../components/Scanner';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AntDesign } from '@expo/vector-icons';
import Authentication from '../viewmodels/auth/Authentication';
import LinkHub from '../viewmodels/hubs/LinkHub';
import { ReactiveScreen } from '../utils/device';
import { StatusBar } from 'expo-status-bar';
import i18n from '../i18n';
import { logQRScanned } from '../viewmodels/services/Analytics';
import { observer } from 'mobx-react-lite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default observer(({ tip, done }: { tip?: string; done?: () => void }) => {
  const { t } = i18n;

  const { top } = useSafeAreaInsets();

  const handleBarCodeScanned = ({ data }: BarCodeScanningResult) => {
    const handled = LinkHub.handleURL(data);

    if (handled) {
      logQRScanned(data);
      done?.();
    }
  };

  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        width: ReactiveScreen.width,
        height: ReactiveScreen.height,
      }}
    >
      <Scanner
        onBarCodeScanned={handleBarCodeScanned}
        style={{ flex: 1, width: '100%', height: '100%', position: 'absolute' }}
      />

      <View
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          height: 48,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <AntDesign name="qrcode" size={29} color={'#fff'} />

        <View>
          <Text style={styles.tip} numberOfLines={1}>
            {Authentication.appAuthorized ? tip || t('qrscan-tip-1') : t('qrscan-tip-desktop-backup-qrcode')}
          </Text>
          <Text style={{ ...styles.tip, fontSize: 9 }}>{t('qrscan-tip-above-types')}</Text>
        </View>
      </View>

      <TouchableOpacity style={{ padding: 8, position: 'absolute', top, left: 4 }} onPress={done}>
        <AntDesign name="close" color="#fff" size={24} />
      </TouchableOpacity>

      <StatusBar style="light" />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {},

  tip: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginStart: 8,
  },
});
