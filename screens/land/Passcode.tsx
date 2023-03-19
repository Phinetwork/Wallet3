import { Loader, SafeViewContainer } from '../../components';
import React, { useEffect, useState } from 'react';

import AppVM from '../../viewmodels/core/App';
import Authentication from '../../viewmodels/auth/Authentication';
import { BackHandler } from 'react-native';
import ConfirmPasscode from '../components/ConfirmPasscode';
import { LandScreenStack } from '../navigations';
import MnemonicOnce from '../../viewmodels/auth/MnemonicOnce';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import i18n from '../../i18n';
import { observer } from 'mobx-react-lite';
import { sleep } from '../../utils/async';
import styles from './styles';
import { themeColor } from '../../constants/styles';

export default observer(({ route }: NativeStackScreenProps<LandScreenStack, 'Backup'>) => {
  const { t } = i18n;
  const [busy, setBusy] = useState(false);

  const finishInitialization = async (passcode: string) => {
    if (Authentication.appAuthorized) return;

    setBusy(true);
    await Authentication.setupPin(passcode);
    await Authentication.authorizeApp(passcode);
    await MnemonicOnce.save();
    await sleep(1000);
    setBusy(false);

    setTimeout(() => AppVM.init(), 5);
  };

  useEffect(() => {
    const event = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => event.remove();
  }, []);

  return (
    <SafeViewContainer style={styles.rootContainer} paddingHeader>
      <ConfirmPasscode
        biometricSupported={Authentication.biometricSupported}
        biometricEnabled={Authentication.biometricEnabled}
        onBiometricValueChange={(v) => Authentication.setBiometrics(v)}
        onDone={finishInitialization}
        themeColor={themeColor}
      />
      <Loader loading={busy} message={t('land-passcode-encrypting')} />
    </SafeViewContainer>
  );
});
