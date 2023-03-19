import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import {
  AppleAuthenticationButton,
  AppleAuthenticationButtonStyle,
  AppleAuthenticationButtonType,
} from 'expo-apple-authentication';
import { Button, Loader, SafeViewContainer } from '../../components';
import { Ionicons, MaterialCommunityIcons, SimpleLineIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native-animatable';
import { secondaryFontColor, secureColor, themeColor } from '../../constants/styles';

import { FadeInDownView } from '../../components/animations';
import { G } from '../../assets/3rd';
import IllustrationVault from '../../assets/illustrations/misc/vault.svg';
import { LandScreenStack } from '../navigations';
import MnemonicOnce from '../../viewmodels/auth/MnemonicOnce';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { SignInType } from '../../viewmodels/auth/SignInWithWeb2';
import SignInWithApple from '../../viewmodels/auth/SignInWithApple';
import SignInWithGoogle from '../../viewmodels/auth/SignInWithGoogle';
import { StatusBar } from 'expo-status-bar';
import i18n from '../../i18n';
import { observer } from 'mobx-react-lite';
import { showMessage } from 'react-native-flash-message';

export default observer(({ navigation }: NativeStackScreenProps<LandScreenStack, 'Welcome'>) => {
  const { t } = i18n;

  const jumpTo = (signInPlatform: 'apple' | 'google', signInResult?: SignInType) => {
    if (!signInResult) {
      return;
    }

    let to: any = '';
    switch (signInResult) {
      case SignInType.new_user:
        to = 'ViewRecoveryKey';
        break;
      case SignInType.recover_key_exists:
        to = 'SetupPasscode';
        break;
      case SignInType.recover_key_not_exists:
        to = 'SetRecoveryKey';
        break;
      case SignInType.failed:
        showMessage({ message: t('msg-sign-in-web2-failed') });
        return;
    }

    navigation.navigate(to, signInPlatform);
  };

  useEffect(() => {
    MnemonicOnce.clean();

    if (Platform.OS === 'ios') {
      SignInWithApple.init();
    }

    SignInWithGoogle.init();
  }, []);

  return (
    <SafeViewContainer style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <FadeInDownView delay={200}>
          <IllustrationVault width={200} height={200} style={{ marginVertical: -24 }} />
        </FadeInDownView>
        <Text
          animation="fadeInUp"
          delay={500}
          style={{ color: secondaryFontColor, fontSize: 12, fontWeight: '500', textTransform: 'capitalize' }}
        >
          {t('land-welcome-short-slogan')}
        </Text>
      </View>

      <View style={{ width: '100%' }}>
        <View animation="fadeInUp" delay={300}>
          <Button
            title={t('land-welcome-import-wallet')}
            onPress={() => navigation.navigate('ImportWallet')}
            themeColor={themeColor}
            style={{ marginBottom: 12 }}
            txtStyle={{ textTransform: 'none' }}
            icon={() => <Ionicons name="wallet-outline" size={16} color={themeColor} />}
            reverse
          />
        </View>

        <View animation="fadeInUp" delay={500}>
          <Button
            themeColor={secureColor}
            title={t('land-welcome-create-multi-sig-wallet')}
            onPress={() => navigation.navigate('CreateMultiSigWallet')}
            icon={() => <MaterialCommunityIcons name="key-chain-variant" color="#fff" size={16} style={{ marginEnd: -2 }} />}
            txtStyle={{ textTransform: 'none' }}
          />
        </View>

        {Platform.OS === 'ios' && SignInWithApple.isAvailable ? (
          <Animated.View entering={FadeInDown.springify()} exiting={FadeOut.delay(0)} style={{ marginTop: 12 }}>
            <AppleAuthenticationButton
              buttonStyle={AppleAuthenticationButtonStyle.BLACK}
              buttonType={AppleAuthenticationButtonType.CONTINUE}
              cornerRadius={7}
              style={{ width: '100%', height: 42 }}
              onPress={async () => jumpTo('apple', await SignInWithApple.signIn())}
            />
          </Animated.View>
        ) : undefined}

        {SignInWithGoogle.isAvailable ? (
          <Animated.View entering={FadeInDown.delay(150).springify()} exiting={FadeOut.delay(100)} style={{ marginTop: 12 }}>
            <Button
              reverse
              icon={() => <G width={12} />}
              themeColor="#EA4335"
              title={t('land-sign-in-continue-with-google')}
              txtStyle={{ textTransform: 'none' }}
              onPress={async () => jumpTo('google', await SignInWithGoogle.signIn())}
            />
          </Animated.View>
        ) : undefined}
      </View>

      <StatusBar style="dark" />

      <Loader loading={SignInWithApple.loading || SignInWithGoogle.loading} message={t('msg-wait-a-moment')} />
    </SafeViewContainer>
  );
});
