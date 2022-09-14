// @ts-nocheck

import { NativeStackScreenProps, createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useRef } from 'react';

import Backup from './Backup';
import CreateWallet from './CreateWallet';
import ImportWallet from './ImportWallet';
import { Ionicons } from '@expo/vector-icons';
import { LandScreenStack } from '../navigations';
import QRScan from '../misc/QRScan';
import SetupPasscode from './Passcode';
import { TouchableOpacity } from 'react-native';
import Welcome from './Welcome';
import i18n from '../../i18n';
import { observer } from 'mobx-react-lite';

const { Navigator, Screen } = createNativeStackNavigator();

export default observer(({ navigation }: NativeStackScreenProps<LandScreenStack, 'Welcome'>) => {
  const { t } = i18n;

  return (
    <Navigator
      screenOptions={{
        headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.pop()}>
            <Ionicons name="arrow-back-outline" size={20} />
          </TouchableOpacity>
        ),
      }}
      initialRouteName="Welcome"
    >
      <Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
      <Screen name="ImportWallet" component={ImportWallet} options={{ title: t('land-welcome-import-wallet') }} />
      <Screen name="CreateWallet" component={CreateWallet} options={{ title: t('land-welcome-create-wallet') }} />
      <Screen name="Backup" component={Backup} options={{ title: t('land-backup-title') }} />
      <Screen name="SetupPasscode" component={SetupPasscode} options={{ title: t('land-passcode-title') }} />

      <Screen
        name="QRScan"
        component={QRScan}
        options={({ navigation }) => {
          return {
            animation: 'slide_from_bottom',
            headerTintColor: '#ffffff',
            title: t('qrscan-title'),
            headerLeft: () => (
              <TouchableOpacity onPress={() => navigation.pop()}>
                <Ionicons name="arrow-back-outline" size={20} color="#ffffff" />
              </TouchableOpacity>
            ),
          };
        }}
      />
    </Navigator>
  );
});
