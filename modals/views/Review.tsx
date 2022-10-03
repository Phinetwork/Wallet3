import { Button, Coin, SafeViewContainer } from '../../components';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import AnimatedNumber from '../../components/AnimatedNumber';
import BackButton from '../components/BackButton';
import { BioType } from '../../viewmodels/Authentication';
import Currency from '../../viewmodels/settings/Currency';
import FaceID from '../../assets/icons/app/FaceID-white.svg';
import GasReview from './GasReview';
import Image from 'react-native-fast-image';
import InsufficientFee from '../components/InsufficientFee';
import Networks from '../../viewmodels/Networks';
import { ReactiveScreen } from '../../utils/device';
import Swiper from 'react-native-swiper';
import Theme from '../../viewmodels/settings/Theme';
import { TokenTransferring } from '../../viewmodels/transferring/TokenTransferring';
import TxException from '../components/TxException';
import UserTxData from './UserTxData';
import { formatAddress } from '../../utils/formatter';
import { generateNetworkIcon } from '../../assets/icons/networks/color';
import i18n from '../../i18n';
import { observer } from 'mobx-react-lite';
import styles from '../styles';
import { utils } from 'ethers';

interface Props {
  onBack?: () => void;
  onSend?: () => Promise<void>;
  onGasPress?: () => void;
  disableBack?: boolean;
  vm: TokenTransferring;
  biometricType?: BioType;
  txDataEditable?: boolean;
  onEditDataPress?: () => void;
}

const ReviewView = observer(
  ({ vm, onBack, onGasPress, onSend, disableBack, biometricType, txDataEditable, onEditDataPress }: Props) => {
    const { t } = i18n;
    const [busy, setBusy] = React.useState(false);
    const { borderColor, textColor, secondaryTextColor, tintColor } = Theme;

    const send = async () => {
      setBusy(true);
      await onSend?.();
      setBusy(false);
    };

    const sendTitle = biometricType === 'faceid' ? t('modal-review-button-slide-to-send') : t('modal-review-button-send');
    const onLongSendPress = biometricType === 'faceid' ? send : undefined;
    const onSendPress = biometricType === 'faceid' ? undefined : send;
    const authIcon = biometricType
      ? biometricType === 'fingerprint'
        ? () => <MaterialCommunityIcons name="fingerprint" size={19} color="#fff" />
        : () => <FaceID width={12.5} height={12.5} style={{ marginEnd: 4 }} />
      : undefined;

    const reviewItemStyle = { ...styles.reviewItem, borderColor };
    const reviewItemsContainer = { ...styles.reviewItemsContainer, borderColor };
    const reviewItemValueStyle = { ...styles.reviewItemValue, color: textColor };

    return (
      <SafeViewContainer style={styles.container}>
        <View style={styles.navBar}>
          {disableBack ? <View /> : <BackButton onPress={onBack} color={Networks.current.color} />}

          <Text style={styles.navTitle}>{t('modal-review-title')}</Text>
        </View>

        <View style={reviewItemsContainer}>
          <View style={reviewItemStyle}>
            <Text style={styles.reviewItemTitle}>{t('modal-review-send')}</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
              <Text
                style={{ ...reviewItemValueStyle, marginEnd: 8, maxWidth: ReactiveScreen.width - 215 }}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {vm.amount}
              </Text>

              <Coin
                address={vm.token.address}
                chainId={vm.network.chainId}
                symbol={vm.token!.symbol}
                forceRefresh
                iconUrl={vm.token?.iconUrl}
              />

              <Text style={{ ...reviewItemValueStyle, marginStart: 8 }}>{vm.token.symbol}</Text>
            </View>
          </View>

          <View style={reviewItemStyle}>
            <Text style={styles.reviewItemTitle}>{t('modal-review-to')}</Text>

            <View style={{ flexDirection: 'row', maxWidth: '72%', alignItems: 'center' }}>
              {(vm.hasZWSP || vm.isContractRecipient) && (
                <View style={{ flexDirection: 'row', alignItems: 'center', position: 'absolute', end: 0, bottom: -11.5 }}>
                  <Ionicons
                    name={vm.isContractWallet ? 'wallet-outline' : 'warning'}
                    size={8}
                    color={vm.isContractWallet ? 'dodgerblue' : 'crimson'}
                    style={{ marginEnd: 4 }}
                  />
                  <Text style={{ fontSize: 8, color: vm.isContractWallet ? 'dodgerblue' : 'crimson' }}>
                    {t(
                      vm.isContractRecipient
                        ? vm.isContractWallet
                          ? 'tip-recipient-is-contract-wallet'
                          : 'tip-recipient-is-contract'
                        : 'tip-zero-width-space'
                    )}
                  </Text>
                </View>
              )}

              {vm.avatar ? (
                <Image source={{ uri: vm.avatar }} style={{ width: 15, height: 15, marginEnd: 5, borderRadius: 100 }} />
              ) : undefined}

              <Text
                numberOfLines={1}
                style={{
                  ...reviewItemValueStyle,
                  color: vm.hasZWSP || vm.isContractRecipient ? (vm.isContractWallet ? 'dodgerblue' : 'crimson') : textColor,
                }}
              >
                {utils.isAddress(vm.to) ? formatAddress(vm.toAddress, 8, 6) : formatAddress(vm.safeTo, 14, 6, '...')}
              </Text>
            </View>
          </View>

          <View style={{ ...reviewItemStyle, borderBottomWidth: 0 }}>
            <Text style={styles.reviewItemTitle}>{t('modal-review-network')}</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {generateNetworkIcon({ ...vm.network, width: 15, style: { marginEnd: 5 } })}
              <Text style={{ ...reviewItemValueStyle, color: vm.network.color, maxWidth: 150 }} numberOfLines={1}>
                {vm.network.network.split(' ')[0]}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            ...reviewItemsContainer,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingStart: 16,
          }}
        >
          <Text style={styles.reviewItemTitle}>{t('modal-review-fee')}</Text>

          <TouchableOpacity
            onPress={onGasPress}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              paddingVertical: 12,
              paddingEnd: 14,
              justifyContent: 'flex-end',
              width: '75%',
            }}
          >
            <Text style={{ ...styles.reviewItemTitle, fontSize: 15 }}>
              {`(${Currency.tokenToUSD(vm.estimatedRealFee, vm.feeTokenSymbol).toFixed(2)} USD)`}
            </Text>

            <AnimatedNumber
              style={{ ...reviewItemValueStyle, marginStart: 2, marginEnd: 5 }}
              numberOfLines={1}
              value={vm.txFee}
              formatter={(val) => val.toFixed(5)}
            />

            <Text style={{ ...reviewItemValueStyle }}>{vm.feeTokenSymbol}</Text>

            <MaterialIcons name="keyboard-arrow-right" size={15} color={secondaryTextColor} style={{ marginBottom: -1 }} />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          {vm.insufficientFee ? <InsufficientFee /> : undefined}

          {txDataEditable && !vm.insufficientFee ? (
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16 }}
              onPress={onEditDataPress}
            >
              <Text style={{ fontWeight: '600', color: secondaryTextColor, fontSize: 12 }}>
                {t('modal-review-edit-tx-message')}
              </Text>
              <MaterialIcons name="keyboard-arrow-right" size={15} color={secondaryTextColor} style={{ marginBottom: -1 }} />
            </TouchableOpacity>
          ) : undefined}
        </View>

        {vm.txException ? <TxException exception={vm.txException} /> : undefined}

        <View style={{ flex: 1 }} />

        <Button
          title={sendTitle}
          themeColor={vm.hasZWSP || (vm.isContractRecipient && !vm.isContractWallet) ? 'crimson' : vm.network.color}
          disabled={!vm.isValidParams || busy}
          onPress={onSendPress}
          onLongPress={onLongSendPress}
          onSwipeSuccess={onLongSendPress}
          icon={authIcon}
        />
      </SafeViewContainer>
    );
  }
);

export default observer((props: Props) => {
  const { onBack, vm, onSend, disableBack } = props;
  const swiper = useRef<Swiper>(null);
  const [type, setType] = useState(0);

  return (
    <Swiper ref={swiper} scrollEnabled={false} showsButtons={false} showsPagination={false} loop={false}>
      <ReviewView
        {...props}
        onEditDataPress={() => {
          setType(1);
          setTimeout(() => swiper.current?.scrollBy(1), 10);
        }}
        onGasPress={() => {
          setType(0);
          setTimeout(() => swiper.current?.scrollBy(1), 10);
        }}
      />

      {type === 0 && <GasReview onBack={() => swiper.current?.scrollTo(0)} vm={vm} themeColor={vm.network.color} />}
      {type === 1 && (
        <UserTxData
          vm={vm}
          themeColor={vm.network.color}
          onBack={() => {
            swiper.current?.scrollTo(0);
            vm.estimateGas();
          }}
        />
      )}
    </Swiper>
  );
});
