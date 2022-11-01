import React, { useEffect, useRef, useState } from 'react';

import { Account } from '../viewmodels/account/Account';
import App from '../viewmodels/core/App';
import { NFCPad } from './views';
import Networks from '../viewmodels/core/Networks';
import { RequestAmount } from './views';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native';
import Swiper from 'react-native-swiper';
import Theme from '../viewmodels/settings/Theme';
import { TransferRequesting } from '../viewmodels/transferring/TransferRequesting';
import { observer } from 'mobx-react-lite';
import styles from './styles';

export default observer((props: { close?: () => void }) => {
  const swiper = useRef<Swiper>(null);
  const [vm] = useState(new TransferRequesting(Networks.current));

  const { tintColor, backgroundColor } = Theme;

  return (
    <SafeAreaProvider style={{ ...styles.safeArea, backgroundColor }}>
      <Swiper
        ref={swiper}
        showsPagination={false}
        showsButtons={false}
        scrollEnabled={false}
        loop={false}
        automaticallyAdjustContentInsets
        removeClippedSubviews
        style={{ overflow: 'hidden' }}
      >
        <RequestAmount {...props} onNext={() => swiper.current?.scrollTo(1)} vm={vm} themeColor={tintColor} />
        <NFCPad onBack={() => swiper.current?.scrollTo(0)} vm={vm} themeColor={tintColor} />
      </Swiper>
    </SafeAreaProvider>
  );
});
