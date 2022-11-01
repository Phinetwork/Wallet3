import { AntDesign, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Button, Coin, SafeViewContainer } from '../../components';
import React, { useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import AnimatedNumber from '../../components/AnimatedNumber';
import BackButton from '../components/BackButton';
import { BioType } from '../../viewmodels/auth/Authentication';
import Currency from '../../viewmodels/settings/Currency';
import FaceID from '../../assets/icons/app/FaceID-white.svg';
import GasReview from './GasReview';
import Image from 'react-native-fast-image';
import InsufficientFee from '../components/InsufficientFee';
import MultiSourceImage from '../../components/MultiSourceImage';
import { NFTTransferring } from '../../viewmodels/transferring/NonFungibleTokenTransferring';
import Networks from '../../viewmodels/core/Networks';
import { ReactiveScreen } from '../../utils/device';
import Swiper from 'react-native-swiper';
import Theme from '../../viewmodels/settings/Theme';
import { TokenTransferring } from '../../viewmodels/transferring/TokenTransferring';
import TxException from '../components/TxException';
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
  vm: NFTTransferring;
  biometricType?: BioType;
}

const NFTReviewView = observer(({ vm, onBack, onGasPress, onSend, disableBack, biometricType }: Props) => {
  const { t } = i18n;
  const [busy, setBusy] = React.useState(false);
  const { borderColor, textColor, secondaryTextColor } = Theme;

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
            <Text style={{ ...reviewItemValueStyle, marginEnd: 8, maxWidth: ReactiveScreen.width - 190 }} numberOfLines={1}>
              {vm.nft.title}
            </Text>

            <MultiSourceImage
              uriSources={vm.nft.images}
              style={{ width: 20, height: 20 }}
              borderRadius={3}
              sourceTypes={vm.nft.types}
            />
          </View>
        </View>

        <View style={reviewItemStyle}>
          <Text style={styles.reviewItemTitle}>{t('modal-review-to')}</Text>

          <View style={{ flexDirection: 'row', maxWidth: '72%', alignItems: 'center' }}>
            {(vm.hasZWSP || vm.isContractRecipient) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', position: 'absolute', end: 0, bottom: -10 }}>
                <Ionicons name="warning" size={8} color="crimson" style={{ marginEnd: 2 }} />
                <Text style={{ fontSize: 8, color: 'crimson' }}>
                  {t(vm.isContractRecipient ? 'tip-recipient-is-contract' : 'tip-zero-width-space')}
                </Text>
              </View>
            )}

            {vm.avatar ? (
              <Image source={{ uri: vm.avatar }} style={{ width: 15, height: 15, marginEnd: 5, borderRadius: 100 }} />
            ) : undefined}

            <Text
              style={{ ...reviewItemValueStyle, color: vm.hasZWSP || vm.isContractRecipient ? 'crimson' : textColor }}
              numberOfLines={1}
            >
              {utils.isAddress(vm.to) ? formatAddress(vm.to, 8, 6) : formatAddress(vm.safeTo, 14, 6, '...')}
            </Text>
          </View>
        </View>

        <View style={reviewItemStyle}>
          <Text style={styles.reviewItemTitle}>{t('modal-review-amount')}</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
            {vm.erc1155Balance.gt(1) && (
              <TouchableOpacity style={{ padding: 4, paddingEnd: 8, marginEnd: 8 }} onPress={() => vm.decreaseAmount()}>
                <AntDesign name="minuscircleo" size={12} color={textColor} />
              </TouchableOpacity>
            )}

            <Text style={{ ...reviewItemValueStyle, maxWidth: ReactiveScreen.width - 190 }} numberOfLines={1}>
              {vm.erc1155TransferAmount}
            </Text>

            {vm.erc1155Balance.gt(1) && (
              <TouchableOpacity
                style={{ padding: 4, paddingStart: 8, marginStart: 8, paddingEnd: 0 }}
                onPress={() => vm.increaseAmount()}
              >
                <AntDesign name="pluscircleo" size={12} color={textColor} />
              </TouchableOpacity>
            )}
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

      {vm.insufficientFee ? <InsufficientFee /> : undefined}

      {vm.txException ? <TxException exception={vm.txException} /> : undefined}

      <View style={{ flex: 1 }} />

      <Button
        title={sendTitle}
        themeColor={vm.hasZWSP || vm.isContractRecipient ? 'crimson' : vm.network.color}
        disabled={!vm.isValidParams || busy}
        onPress={onSendPress}
        onLongPress={onLongSendPress}
        onSwipeSuccess={onLongSendPress}
        icon={authIcon}
      />
    </SafeViewContainer>
  );
});

export default observer((props: Props) => {
  const { onBack, vm, onSend, disableBack } = props;
  const swiper = useRef<Swiper>(null);

  return (
    <Swiper ref={swiper} scrollEnabled={false} showsButtons={false} showsPagination={false} loop={false}>
      <NFTReviewView {...props} onGasPress={() => swiper.current?.scrollBy(1)} />
      <GasReview onBack={() => swiper.current?.scrollTo(0)} vm={vm} themeColor={vm.network.color} />
    </Swiper>
  );
});
