import * as Animatable from 'react-native-animatable';

import { Coin, SafeViewContainer } from '../../components';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useRef } from 'react';
import { secondaryFontColor, thirdFontColor } from '../../constants/styles';

import BackButton from '../components/BackButton';
import { BlankPNG } from '../../common/Constants';
import CachedImage from 'react-native-fast-image';
import CopyableText from '../../components/CopyableText';
import IPhone from '../../assets/icons/app/IPhone.svg';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import Swiper from 'react-native-swiper';
import { TransferRequesting } from '../../viewmodels/transferring/TransferRequesting';
import { generateNetworkIcon } from '../../assets/icons/networks/color';
import i18n from '../../i18n';
import { isIOS } from '../../utils/platform';
import { observer } from 'mobx-react-lite';
import styles from '../styles';

interface SubViewProps {
  onBack?: () => void;
  onQRPress?: () => void;
  themeColor?: string;
}

const NFCView = observer((props: SubViewProps) => {
  const phone1TranslateAnimation = {
    0: {
      opacity: 0,
      transform: [{ rotateZ: '180deg' }, { translateY: 90 }],
    },
    0.15: {
      opacity: 1,
      transform: [{ rotateZ: '180deg' }, { translateY: 30 }],
    },
    1: {
      transform: [{ rotateZ: '180deg' }, { translateY: 30 }],
    },
  };

  const phone2TranslateAnimation = {
    0: {
      opacity: 0,
      transform: [{ translateY: 90 }],
    },
    0.15: {
      opacity: 1,
      transform: [{ translateY: 30 }],
    },
    1: {
      transform: [{ translateY: 30 }],
    },
  };

  const waveAnimation = {
    0: {
      opacity: 0.2,
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
    },
    0.7: {
      opacity: 1,
      width: 200,
      height: 200,
      borderRadius: 100,
      borderWidth: 2,
    },
    1: {
      opacity: 0,
      width: 300,
      height: 300,
      borderRadius: 150,
      borderWidth: 2,
    },
  };

  return (
    <SafeViewContainer style={styles.container}>
      <View style={styles.navBar}>
        <BackButton onPress={props.onBack} color={props.themeColor} />

        <TouchableOpacity style={styles.navMoreButton} onPress={props.onQRPress}>
          <Ionicons name="qr-code-outline" size={17} color={secondaryFontColor} />
          <Text style={{ fontSize: 19, marginStart: 8, color: secondaryFontColor, fontWeight: '500' }}>QRCode</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <View style={{ flexDirection: 'row', alignSelf: 'center', justifyContent: 'center' }}>
            <Animatable.View
              animation={phone1TranslateAnimation}
              easing="ease-out-cubic"
              duration={12 * 1000}
              style={{
                marginEnd: 2,
                position: 'relative',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2,
              }}
            >
              <IPhone width={82} style={{ opacity: 1, zIndex: 5 }} />
              <Animatable.View
                iterationCount={'infinite'}
                animation={waveAnimation}
                duration={2.5 * 1000}
                style={{
                  borderColor: 'aliceblue',
                  position: 'absolute',
                }}
              />
            </Animatable.View>

            <Animatable.View
              animation={phone2TranslateAnimation}
              easing="ease-out-cubic"
              duration={12 * 1000}
              style={{ marginStart: 2, position: 'relative', justifyContent: 'center', alignItems: 'center' }}
            >
              <Animatable.View
                iterationCount={'infinite'}
                animation={waveAnimation}
                duration={3 * 1000}
                delay={1 * 1000}
                style={{
                  borderColor: 'aliceblue',
                  position: 'absolute',
                }}
              />
              <IPhone width={82} />
            </Animatable.View>
          </View>
        </View>

        <Animatable.Text style={{ color: secondaryFontColor, fontSize: 17, textAlign: 'center', marginTop: 16 }}>
          Put phones nearby
        </Animatable.Text>
      </View>
    </SafeViewContainer>
  );
});

interface Props {
  onBack?: () => void;
  vm: TransferRequesting;
  themeColor?: string;
}

const QRView = observer(({ vm, onBack, themeColor }: Props) => {
  const { token, amount, requestingUri, network } = vm;
  const { avatar } = vm.currentAccount;
  const { t } = i18n;

  return (
    <SafeViewContainer style={styles.container}>
      <View style={styles.navBar}>
        <BackButton onPress={onBack} color={themeColor} />

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {generateNetworkIcon({
            ...network,
            width: 24,
            height: 24,
            // style: { marginEnd: 5 },
          })}
          {/* <Text style={{ fontSize: 17, fontWeight: '500', color: network.color }}>{network.network}</Text> */}
        </View>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Coin
            symbol={token.symbol}
            address={token.address}
            chainId={vm.network.chainId}
            style={{ marginHorizontal: 10, marginTop: -1 }}
            size={25}
            forceRefresh
          />
          <Text
            style={{ ...styles.navTitle, fontSize: 24, fontWeight: '300', color: thirdFontColor, maxWidth: '70%' }}
            ellipsizeMode="middle"
            numberOfLines={1}
          >{`${amount}`}</Text>
          <Text style={{ ...styles.navTitle, fontSize: 24, fontWeight: '300', color: thirdFontColor }}>
            {`${token.symbol}`}
          </Text>
        </View>

        <View
          style={[
            isIOS
              ? {
                  shadowColor: '#000',
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.23,
                  shadowRadius: 2.62,
                  elevation: 5,
                }
              : {},
            {
              position: 'relative',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 24,
              borderRadius: 15,
            },
          ]}
        >
          <QRCode
            value={requestingUri}
            size={180}
            backgroundColor="transparent"
            enableLinearGradient
            logoBorderRadius={7}
            logo={{ uri: BlankPNG }}
            logoSize={29}
            linearGradient={['rgb(134, 65, 244)', 'rgb(66, 194, 244)']}
          />

          {avatar ? (
            <CachedImage source={{ uri: avatar }} style={viewStyles.avatar} />
          ) : (
            <Image source={require('../../assets/icon.png')} style={viewStyles.avatar} />
          )}
        </View>

        <CopyableText
          title={t('tip-copy-link')}
          copyText={requestingUri}
          txtStyle={{ fontSize: 12, maxWidth: 185, color: thirdFontColor }}
          iconColor={thirdFontColor}
          iconStyle={{ marginHorizontal: 4 }}
          iconSize={10}
        />
      </View>
    </SafeViewContainer>
  );
});

interface DefaultProps {
  onBack?: () => void;
  vm: TransferRequesting;
  themeColor?: string;
}

export default observer((props: DefaultProps) => {
  const swiper = useRef<Swiper>(null);
  const { vm } = props;

  return (
    <Swiper ref={swiper} scrollEnabled={false} showsButtons={false} showsPagination={false} loop={false}>
      {/* <NFCView onBack={props.onBack} onQRPress={() => swiper.current?.scrollTo(1)} themeColor={props.themeColor} /> */}
      <QRView {...props} vm={vm} />
      {/* onBack={() => swiper.current?.scrollTo(0)} */}
    </Swiper>
  );
});

const viewStyles = StyleSheet.create({
  avatar: {
    width: 24,
    height: 24,
    position: 'absolute',
    backgroundColor: 'rgb(134, 194, 244)',
    borderRadius: 6,
  },
});
