import React, { useEffect, useState } from 'react';

import Authentication from '../../viewmodels/auth/Authentication';
import Packing from '../views/Packing';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Success from '../views/Success';
import Theme from '../../viewmodels/settings/Theme';
import TxRequest from '../compositions/TxRequest';
import { WCCallRequestRequest } from '../../models/entities/WCSession_v1';
import { WalletConnectTransactionRequest } from '../../viewmodels/transferring/WalletConnectTransactionRequest';
import { WalletConnect_v1 } from '../../viewmodels/walletconnect/WalletConnect_v1';
import { WalletConnect_v2 } from '../../viewmodels/walletconnect/WalletConnect_v2';
import i18n from '../../i18n';
import { observer } from 'mobx-react-lite';
import { showMessage } from 'react-native-flash-message';
import styles from '../styles';

interface Props {
  client: WalletConnect_v1 | WalletConnect_v2;
  request: WCCallRequestRequest;
  close: Function;
}

export default observer(({ client, request, close }: Props) => {
  const [vm] = useState(new WalletConnectTransactionRequest({ client, request }));
  const [verified, setVerified] = useState(false);
  const [networkBusy, setNetworkBusy] = useState(false);
  const { biometricEnabled, biometricType } = Authentication;

  useEffect(() => {
    return () => vm.dispose();
  }, []);

  const reject = () => {
    client.rejectRequest(request.id, 'User rejected');
    close();
  };

  const sendTx = async (pin?: string) => {
    const result = await vm.sendTx({ pin, onNetworkRequest: () => setNetworkBusy(true), });

    if (result.success) {
      setVerified(true);
      client.approveRequest(request.id, result['tx']?.hash || '');
      setTimeout(() => close(), 1700);
    }

    return result.success;
  };

  return (
    <SafeAreaProvider style={{ ...styles.safeArea, height: 520 }}>
      {verified ? (
        <Success />
      ) : networkBusy ? (
        <Packing />
      ) : (
        <TxRequest app={vm.appMeta} vm={vm} onApprove={sendTx} onReject={reject} bioType={biometricType} />
      )}
    </SafeAreaProvider>
  );
});
