import { ContactsPad, Passpad, ReviewPad, SendAmount } from './views';
import React, { useEffect, useRef, useState } from 'react';

import App from '../viewmodels/core/App';
import Authentication from '../viewmodels/auth/Authentication';
import Contacts from '../viewmodels/customs/Contacts';
import { ReactiveScreen } from '../utils/device';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Success from './views/Success';
import Swiper from 'react-native-swiper';
import Theme from '../viewmodels/settings/Theme';
import { TokenTransferring } from '../viewmodels/transferring/TokenTransferring';
import { observer } from 'mobx-react-lite';
import styles from './styles';

interface Props {
  vm: TokenTransferring;
  erc681?: boolean;
  onClose?: () => void;
}

export default observer(({ vm, onClose, erc681 }: Props) => {
  const [verified, setVerified] = useState(false);
  const swiper = useRef<Swiper>(null);
  const { backgroundColor } = Theme;
  const [active] = useState({ index: 0 });

  useEffect(() => {
    const jump = () =>
      setTimeout(() => {
        try {
          verified ? undefined : swiper.current?.scrollTo(Math.max(0, active.index - 1));
        } catch {}
      }, 100);

    ReactiveScreen.on('change', jump);

    return () => {
      ReactiveScreen.off('change', jump);
    };
  }, []);

  const sendTx = async (pin?: string) => {
    const result = await vm.sendTx(pin);

    if (result.success) {
      setVerified(true);
      setTimeout(() => onClose?.(), 1700);
    }

    return result.success;
  };

  const onSendClick = async () => {
    const selfAccount = App.allAccounts.find((c) => c.address === vm.toAddress);

    Contacts.saveContact({
      address: vm.toAddress,
      ens: vm.isEns ? vm.to : undefined,
      name: selfAccount?.nickname,
      emoji: selfAccount ? { icon: selfAccount.emojiAvatar, color: selfAccount.emojiColor } : undefined,
    });

    if (!Authentication.biometricEnabled) {
      swiper.current?.scrollTo(3);
      return;
    }

    if (await sendTx()) return;
    swiper.current?.scrollTo(3);
  };

  return (
    <SafeAreaProvider style={{ ...styles.safeArea, backgroundColor }}>
      {verified ? (
        <Success />
      ) : (
        <Swiper
          ref={swiper}
          showsPagination={false}
          showsButtons={false}
          scrollEnabled={false}
          loop={false}
          onIndexChanged={(index) => (active.index = index)}
          automaticallyAdjustContentInsets
        >
          {erc681 ? undefined : <ContactsPad onNext={() => swiper.current?.scrollTo(1, true)} vm={vm} />}
          {erc681 ? undefined : (
            <SendAmount
              vm={vm}
              onBack={() => swiper.current?.scrollTo(0)}
              onNext={() => {
                swiper.current?.scrollTo(2);
                vm.estimateGas();
              }}
            />
          )}

          <ReviewPad
            onBack={() => swiper.current?.scrollTo(1)}
            vm={vm}
            onSend={onSendClick}
            disableBack={erc681}
            biometricType={Authentication.biometricType}
            txDataEditable={vm.isNativeToken}
          />

          <Passpad themeColor={vm.network.color} onCodeEntered={sendTx} onCancel={() => swiper.current?.scrollTo(2)} />
        </Swiper>
      )}
    </SafeAreaProvider>
  );
});
