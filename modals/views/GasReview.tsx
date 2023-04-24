import { Button, Coin, SafeViewContainer } from '../../components';
import { Entypo, FontAwesome5, Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import AnimatedNumber from '../../components/AnimatedNumber';
import BackButton from '../components/BackButton';
import { BaseTransaction } from '../../viewmodels/transferring/BaseTransaction';
import FeeTokenList from './TokenBalanceList';
import Fire from '../../assets/icons/app/fire.svg';
import { IFungibleToken } from '../../models/Interfaces';
import Swiper from 'react-native-swiper';
import Theme from '../../viewmodels/settings/Theme';
import TinyInfo from '../components/TinyInfo';
import Tokenlist from './TokenPlainList';
import TxException from '../components/TxException';
import i18n from '../../i18n';
import { observer } from 'mobx-react-lite';
import styles from '../styles';
import { warningColor } from '../../constants/styles';

interface GasProps {
  onBack?: () => void;
  vm: BaseTransaction;
  themeColor?: string;
}

export default observer(({ onBack, vm, themeColor }: GasProps) => {
  const { t } = i18n;
  const { borderColor, textColor, secondaryTextColor, thirdTextColor } = Theme;
  const swiper = useRef<Swiper>(null);

  const { network, feeTokens, paymaster } = vm;
  const editable = !vm.isERC4337Account;
  const reviewItemStyle = { ...styles.reviewItem, borderColor };
  const reviewItemsContainer = { ...styles.reviewItemsContainer, borderColor };
  const reviewItemValueStyle = { ...styles.reviewItemValue, color: editable ? textColor : 'lightgrey', minWidth: 64 };
  const reviewItemTitle = [styles.reviewItemTitle, { color: secondaryTextColor }];
  const gasGweiLabel = [styles.gasGweiLabel, { color: secondaryTextColor }];

  return (
    <Swiper
      ref={swiper}
      showsPagination={false}
      showsButtons={false}
      scrollEnabled={false}
      loop={false}
      automaticallyAdjustContentInsets
    >
      <SafeViewContainer style={styles.container}>
        <View style={styles.navBar}>
          <BackButton onPress={onBack} color={themeColor} disabled={!vm.isValidGas} />

          <Text style={styles.navTitle}>{t('modal-review-fee')}</Text>
        </View>

        <View style={[reviewItemsContainer]}>
          <View style={{ ...reviewItemStyle, paddingBottom: 12 }}>
            <Text style={reviewItemTitle}>{t('modal-gas-review-limit')}</Text>

            <TextInput
              keyboardType="number-pad"
              selectTextOnFocus
              placeholder="21000"
              editable={editable}
              textAlign="right"
              style={{ ...reviewItemValueStyle, fontSize: 20 }}
              maxLength={12}
              defaultValue={`${vm.gasLimit}`}
              onChangeText={(txt) => vm.setGasLimit(txt)}
            />
          </View>

          <View style={{ ...reviewItemStyle, paddingBottom: 12 }}>
            <Text style={reviewItemTitle}>{t('modal-gas-review-max-price')}</Text>

            <View style={{ marginBottom: -8 }}>
              <TextInput
                keyboardType="decimal-pad"
                selectTextOnFocus
                placeholder="20.00"
                textAlign="right"
                maxLength={12}
                editable={editable}
                style={{ ...reviewItemValueStyle, fontSize: 20 }}
                defaultValue={`${Number(vm.maxGasPrice.toFixed(5))}`}
                onChangeText={(txt) => vm.setMaxGasPrice(txt)}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                {network.eip1559 ? <Fire width={8} height={8} style={{ marginEnd: 3 }} /> : undefined}
                {network.eip1559 ? (
                  <AnimatedNumber
                    style={gasGweiLabel}
                    value={vm.nextBlockBaseFee}
                    formatter={(val) => `${val.toFixed(6)} Gwei`}
                  />
                ) : (
                  <Text style={gasGweiLabel}>Gwei</Text>
                )}
              </View>
            </View>
          </View>

          {network.eip1559 ? (
            <View style={{ ...reviewItemStyle, paddingBottom: 12 }}>
              <Text style={reviewItemTitle}>{t('modal-gas-review-priority-price')}</Text>

              <View style={{ marginBottom: -8 }}>
                <TextInput
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                  placeholder="1.00"
                  textAlign="right"
                  maxLength={12}
                  editable={editable}
                  style={{ ...reviewItemValueStyle, fontSize: 20 }}
                  defaultValue={`${Number(vm.maxPriorityPrice.toFixed(6))}`}
                  onChangeText={(txt) => vm.setPriorityPrice(txt)}
                />
                <Text style={[gasGweiLabel, { marginTop: -2 }]}>Gwei</Text>
              </View>
            </View>
          ) : undefined}

          <View style={{ ...reviewItemStyle, borderBottomWidth: 0, paddingBottom: 12 }}>
            <Text style={reviewItemTitle}>{t('modal-gas-review-nonce')}</Text>

            <TextInput
              keyboardType="number-pad"
              selectTextOnFocus
              placeholder="0"
              textAlign="right"
              editable={editable}
              style={{ ...reviewItemValueStyle, fontSize: 20 }}
              maxLength={12}
              defaultValue={`${vm.nonce}`}
              onChangeText={(txt) => vm.setNonce(txt)}
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View
            style={{
              ...reviewItemsContainer,
              justifyContent: 'space-around',
              flexDirection: 'row',
              flex: 1,
            }}
          >
            <TouchableOpacity style={styles.gasSpeedItem} onPress={() => vm.setGas('rapid')}>
              <Ionicons name="rocket" size={12} color={'tomato'} />
              <Text style={{ ...styles.gasItemText, color: 'tomato' }}>{t('modal-gas-review-rapid')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gasSpeedItem} onPress={() => vm.setGas('fast')}>
              <Ionicons name="car-sport" size={13} color={'dodgerblue'} />
              <Text style={{ ...styles.gasItemText, color: 'dodgerblue' }}>{t('modal-gas-review-fast')}</Text>
            </TouchableOpacity>

            <TouchableOpacity disabled={!editable} style={styles.gasSpeedItem} onPress={() => vm.setGas('standard')}>
              <FontAwesome5 name="walking" size={12} color={editable ? 'darkorchid' : secondaryTextColor} />
              <Text style={{ ...styles.gasItemText, color: editable ? 'darkorchid' : secondaryTextColor }} numberOfLines={1}>
                {t('modal-gas-review-standard')}
              </Text>
            </TouchableOpacity>
          </View>

          {vm.isERC4337Account && vm.feeTokens?.length ? (
            <View style={{ ...reviewItemsContainer }}>
              <TouchableOpacity
                disabled={paymaster?.serviceUnavailable}
                onPress={() => swiper.current?.scrollTo(1)}
                style={{
                  ...styles.gasSpeedItem,
                  paddingStart: 12,
                  paddingEnd: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  opacity: paymaster?.serviceUnavailable ? 0.2 : 1,
                }}
              >
                <Coin
                  forceRefresh
                  symbol={paymaster?.feeToken?.symbol ?? network.symbol}
                  address={paymaster?.feeToken?.address ?? ''}
                  chainId={network.chainId}
                  size={14}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    ...styles.gasItemText,
                    fontSize: 14,
                    marginStart: 6,
                    marginEnd: 2,
                    color: textColor,
                    fontWeight: '600',
                    maxWidth: 100,
                  }}
                >
                  {paymaster?.feeToken?.symbol ?? network.symbol}
                </Text>
                <Entypo name="chevron-right" color={secondaryTextColor} />
              </TouchableOpacity>
            </View>
          ) : undefined}
        </View>

        {!vm.isValidGas && (
          <TxException
            containerStyle={{ marginTop: 10, backgroundColor: vm.isERC4337Network ? '#cccccc' : warningColor }}
            exception={t(vm.isERC4337Network ? 'erc4337-not-support-gas-adjustment' : 'tip-invalid-gas-price')}
          />
        )}

        {vm.isUsingERC4337 && paymaster?.serviceUnavailable && (
          <TxException
            exception="Fee paying service is not available."
            containerStyle={{ marginTop: 10, backgroundColor: 'orange' }}
          />
        )}

        <View style={{ flex: 1 }} />

        <Button
          title="OK"
          txtStyle={{ textTransform: 'uppercase' }}
          onPress={onBack}
          themeColor={themeColor}
          disabled={!vm.isValidGas}
        />
      </SafeViewContainer>

      <SafeViewContainer style={{ flex: 1, paddingHorizontal: 0, paddingTop: 0 }}>
        <FeeTokenList
          network={network}
          tokens={feeTokens}
          selectedToken={paymaster?.feeToken}
          themeColor={network.color}
          onBack={() => swiper.current?.scrollTo(0)}
          onTokenSelected={(token) => {
            vm.setFeeToken(token as IFungibleToken);
            swiper.current?.scrollTo(0);
          }}
        />

        <TinyInfo
          icon="information-circle"
          color={thirdTextColor}
          message="The service provider will charge 5-25% service fee if you pay gas fee with ERC20 tokens."
          style={{ paddingHorizontal: 16, paddingEnd: 24 }}
        />
      </SafeViewContainer>
    </Swiper>
  );
});
