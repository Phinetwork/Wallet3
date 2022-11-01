import React, { useState } from 'react';

import Authentication from '../viewmodels/auth/Authentication';
import { InpageDAppSignRequest } from '../screens/browser/controller/InpageDAppController';
import Networks from '../viewmodels/core/Networks';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Sign from './compositions/Sign';
import Success from './views/Success';
import Theme from '../viewmodels/settings/Theme';
import { observer } from 'mobx-react-lite';
import styles from './styles';

interface Props extends InpageDAppSignRequest {
  close: () => void;
}

export default observer(({ msg, type, chainId, typedData, approve, reject, close, account, metadata }: Props) => {
  const [verified, setVerified] = useState(false);
  const [themeColor] = useState(Networks.find(chainId)?.color ?? Networks.Ethereum.color);
  const { backgroundColor } = Theme;

  const onReject = () => {
    reject();
    close();
  };

  const onApprove = async (opt?: { pin?: string; standardMode?: boolean }) => {
    const result = await approve(opt);
    setVerified(result);
    if (result) setTimeout(() => close(), 1750);
    return result;
  };

  return (
    <SafeAreaProvider style={{ ...styles.safeArea, backgroundColor }}>
      {verified ? (
        <Success />
      ) : (
        <Sign
          msg={msg}
          type={type}
          themeColor={themeColor}
          onReject={onReject}
          onSign={onApprove}
          sign={onApprove}
          typedData={typedData}
          biometricType={Authentication.biometricType}
          account={account}
          metadata={metadata}
        />
      )}
    </SafeAreaProvider>
  );
});
