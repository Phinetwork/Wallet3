import { Entypo, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { fontColor, secondaryFontColor } from '../../constants/styles';

import App from '../../viewmodels/core/App';
import Authentication from '../../viewmodels/auth/Authentication';
import { Confirm } from '../../modals/views/Confirm';
import CurrencyViewmodel from '../../viewmodels/settings/Currency';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { FullPasspad } from '../../modals/views/Passpad';
import { InappBrowserModal } from '../Modalize';
import Langs from '../../viewmodels/settings/Langs';
import Networks from '../../viewmodels/core/Networks';
import { Portal } from 'react-native-portalize';
import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import SquircleModalize from '../../modals/core/SquircleModalize';
import Theme from '../../viewmodels/settings/Theme';
import { Toggle } from '../../components';
import ToggleSwitch from 'toggle-switch-react-native';
import UI from '../../viewmodels/settings/UI';
import i18n from '../../i18n';
import { observer } from 'mobx-react-lite';
import { openInappBrowser } from '../../modals/app/InappBrowser';
import { useModalize } from 'react-native-modalize/lib/utils/use-modalize';

type SettingsStack = {
  Settings: undefined;
};

export default observer(({ navigation }: DrawerScreenProps<SettingsStack, 'Settings'>) => {
  const { t } = i18n;

  const parent = navigation.getParent();
  const [jumpToScreen, setJumpToScreen] = React.useState('');
  const { ref: passcodeRef, open: openPasscode, close: closePasscode } = useModalize();
  const { ref: resetRef, open: openReset } = useModalize();
  const { textColor, mode } = Theme;
  const { currentWallet } = App;

  const openChangePasscode = () => {
    openPasscode();
    setJumpToScreen('ChangePasscode');
  };

  const openResetApp = () => {
    openPasscode();
    setJumpToScreen('ResetApp');
  };

  const itemText = { ...styles.itemText, color: textColor };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }} alwaysBounceVertical={false}>
      <Text style={{ ...styles.sectionTitle, marginTop: 0 }}>{t('settings-general')}</Text>

      <TouchableOpacity style={styles.itemContainer} onPress={() => parent?.navigate('Languages')}>
        <View style={styles.itemSubContainer}>
          <Ionicons name="language-outline" style={styles.itemStartSymbol} size={16} color={textColor} />
          <Text style={itemText}>{t('settings-general-language')}</Text>
        </View>
        <View style={styles.itemSubContainer}>
          <Text style={styles.itemText2}>{Langs.currentLang.name}</Text>
          <Entypo name="chevron-right" style={styles.itemEndSymbol} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.itemContainer} onPress={() => parent?.navigate('Currencies')}>
        <View style={styles.itemSubContainer}>
          <MaterialCommunityIcons name="currency-eth" style={styles.itemStartSymbol} size={16} color={textColor} />
          <Text style={itemText}>{t('settings-general-currency')}</Text>
        </View>
        <View style={styles.itemSubContainer}>
          <Text style={styles.itemText2}>{CurrencyViewmodel.currentCurrency?.currency}</Text>
          <Entypo name="chevron-right" style={styles.itemEndSymbol} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.itemContainer} onPress={() => parent?.navigate('Themes')}>
        <View style={styles.itemSubContainer}>
          <Ionicons name="color-palette-outline" style={styles.itemStartSymbol} size={16} color={textColor} />
          <Text style={itemText}>{t('settings-general-theme')}</Text>
        </View>
        <View style={styles.itemSubContainer}>
          <Text style={styles.itemText2}>{t(`settings-general-theme-${mode}`)}</Text>
          <Entypo name="chevron-right" style={styles.itemEndSymbol} />
        </View>
      </TouchableOpacity>

      <View style={styles.itemContainer}>
        <View style={styles.itemSubContainer}>
          <MaterialCommunityIcons name="gas-station" style={styles.itemStartSymbol} size={16} color={textColor} />
          <Text style={itemText}>{t('settings-general-gas-indicator')}</Text>
        </View>

        <Toggle isOn={UI.gasIndicator} onToggle={(v) => UI.switchGasIndicator(v)} onColor={Networks.current.color} />
      </View>

      <Text style={styles.sectionTitle}>{t('settings-security')}</Text>

      {Authentication.biometricSupported ? (
        <View style={styles.itemContainer}>
          <View style={styles.itemSubContainer}>
            <Ionicons name="finger-print-outline" style={styles.itemStartSymbol} size={16} color={textColor} />
            <Text style={itemText}>{t('settings-security-biometric')}</Text>
          </View>

          <Toggle
            isOn={Authentication.biometricEnabled}
            onToggle={(v) => Authentication.setBiometrics(v)}
            onColor={Networks.current.color}
          />
        </View>
      ) : undefined}

      <TouchableOpacity style={styles.itemContainer} onPress={() => openChangePasscode()}>
        <View style={styles.itemSubContainer}>
          <Ionicons name="keypad-outline" style={styles.itemStartSymbol} size={16} color={textColor} />
          <Text style={itemText}>{t('settings-security-passcode')}</Text>
        </View>

        <View style={styles.itemSubContainer}>
          <Entypo name="chevron-right" style={styles.itemEndSymbol} />
        </View>
      </TouchableOpacity>

      {!currentWallet?.isMultiSig && (
        <TouchableOpacity style={styles.itemContainer} onPress={() => parent?.navigate('Backup')}>
          <View style={styles.itemSubContainer}>
            <Ionicons name="file-tray-outline" style={styles.itemStartSymbol} size={16} color={textColor} />
            <Text style={itemText}>{t('settings-security-backup')}</Text>
          </View>
          <View style={styles.itemSubContainer}>
            <Entypo name="chevron-right" style={styles.itemEndSymbol} />
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.itemContainer} onPress={() => openResetApp()}>
        <View style={styles.itemSubContainer}>
          <Ionicons name="backspace-outline" style={styles.itemStartSymbol} size={16} color={textColor} />
          <Text style={itemText}>{t('settings-security-reset')}</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>{t('settings-legal')}</Text>

      {/* <TouchableOpacity style={styles.itemContainer}>
        <View style={styles.itemSubContainer}>
          <Ionicons name="flask-outline" style={styles.itemStartSymbol} size={16} />
          <Text style={styles.itemText}>Terms of Service</Text>
        </View>
        <View style={styles.itemSubContainer}>
          <Entypo name="chevron-right" style={styles.itemEndSymbol} />
        </View>
      </TouchableOpacity> */}

      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => openInappBrowser('https://chainbow.co.jp/privacy.html', 'settings')}
      >
        <View style={styles.itemSubContainer}>
          <Ionicons name="magnet-outline" style={styles.itemStartSymbol} size={16} color={textColor} />
          <Text style={itemText}>{t('settings-legal-privacy')}</Text>
        </View>
        <View style={styles.itemSubContainer}>
          <Entypo name="chevron-right" style={styles.itemEndSymbol} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.itemContainer} onPress={() => parent?.navigate('About')}>
        <View style={styles.itemSubContainer}>
          <Ionicons name="information-circle-outline" style={styles.itemStartSymbol} size={16} color={textColor} />
          <Text style={itemText}>{t('settings-legal-about')}</Text>
        </View>
        <View style={styles.itemSubContainer}>
          <Entypo name="chevron-right" style={styles.itemEndSymbol} />
        </View>
      </TouchableOpacity>

      <Portal>
        <SquircleModalize ref={passcodeRef} panGestureEnabled={false} panGestureComponentEnabled={false} withHandle={false}>
          <FullPasspad
            themeColor={Networks.current.color}
            height={420}
            appAvailable={true}
            failedAttempts={Authentication.failedAttempts}
            onCodeEntered={async (code) => {
              const success = await Authentication.verifyPin(code);
              if (!success) return false;

              if (jumpToScreen === 'ResetApp') {
                setTimeout(() => openReset(), 25);
              } else {
                parent?.navigate(jumpToScreen);
              }

              closePasscode();
              return true;
            }}
          />
        </SquircleModalize>

        <SquircleModalize ref={resetRef} safeAreaStyle={{ minHeight: 270, height: 270 }}>
          <Confirm
            onSwipeConfirm={() => App.reset()}
            confirmButtonTitle={t('settings-reset-modal-button-confirm')}
            desc={t('settings-modal-erase')}
            themeColor="crimson"
            style={{ flex: 1 }}
          />
        </SquircleModalize>

        <InappBrowserModal pageKey="settings" />
      </Portal>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    justifyContent: 'space-between',
  },

  itemSubContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  itemText: {
    fontSize: 17,
    color: fontColor,
  },

  itemText2: {
    fontSize: 17,
    color: secondaryFontColor,
  },

  itemStartSymbol: {
    marginEnd: 12,
  },

  itemEndSymbol: {
    color: secondaryFontColor,
    marginStart: 8,
  },

  sectionTitle: {
    color: secondaryFontColor,
    marginTop: 32,
    marginBottom: 4,
  },
});
