import ContextMenu, { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view';
import { Entypo, Feather, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { FlatList, ListRenderItemInfo, NativeSyntheticEvent, Text, TouchableOpacity, View } from 'react-native';
import { NetworkIcons, generateNetworkIcon } from '../assets/icons/networks/color';
import { SafeViewContainer, Separator } from '../components';
import { useEffect, useRef, useState } from 'react';

import EditNetwork from './views/EditNetwork';
import { INetwork } from '../common/Networks';
import Networks from '../viewmodels/core/Networks';
import React from 'react';
import { ReactiveScreen } from '../utils/device';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Swiper from 'react-native-swiper';
import Theme from '../viewmodels/settings/Theme';
import i18n from '../i18n';
import { observer } from 'mobx-react-lite';
import { startLayoutAnimation } from '../utils/animations';
import styles from './styles';

interface Props {
  onNetworkPress?: (network: INetwork) => void;
  networks?: INetwork[];
  selectedNetwork?: INetwork | null;
  title?: string;
  useContextMenu?: boolean;
  onEditing?: (editing: boolean) => void;
}

export default observer(({ title, onNetworkPress, selectedNetwork, useContextMenu, onEditing, networks }: Props) => {
  const { t } = i18n;
  const { backgroundColor, secondaryTextColor, borderColor } = Theme;
  const [nets, setNets] = useState<INetwork[]>();
  const [editNetwork, setEditNetwork] = useState<INetwork>();
  const swiper = useRef<Swiper>(null);
  const flatList = useRef<FlatList>(null);

  useEffect(() => {
    const timer = setTimeout(() => setNets(networks ?? Networks.all), 25);
    const reset = () => {
      swiper.current?.scrollTo(0);
      onEditing?.(false);
    };

    ReactiveScreen.on('change', reset);

    return () => {
      clearTimeout(timer);
      ReactiveScreen.off('change', reset);
    };
  }, []);

  const renderItem = ({ item }: ListRenderItemInfo<INetwork>) => {
    return (
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 16 }}
        onPress={() => onNetworkPress?.(item)}
      >
        <Feather
          name="check"
          color={item.color}
          size={15}
          style={{ opacity: (selectedNetwork ?? Networks.current)?.network === item.network ? 1 : 0 }}
        />

        <View style={{ width: 32, alignItems: 'center', justifyContent: 'center', marginStart: 8 }}>
          {NetworkIcons[item.chainId] ??
            generateNetworkIcon({
              chainId: item.chainId,
              color: item.color,
              width: 32,
              height: 30,
              symbol: item.symbol,
              hideEVMTitle: true,
            })}
        </View>

        <Text
          style={{ fontSize: 16, marginStart: 12, fontWeight: '500', color: item.color, maxWidth: '70%' }}
          numberOfLines={1}
        >
          {item.network}
        </Text>

        <View style={{ flex: 1 }} />

        {item.l2 || item.testnet ? (
          <View
            style={{
              borderRadius: 5,
              backgroundColor: item.l2 ? item.color : 'deepskyblue',
              padding: 2,
              paddingHorizontal: 6,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 12, color: 'white', fontWeight: '500' }}>
              {item.l2 ? 'L2' : item.testnet ? 'Testnet' : ''}
            </Text>
          </View>
        ) : undefined}

        {item.pinned ? <Entypo name="pin" color={item.color} style={{ marginStart: 12, marginTop: 1 }} /> : undefined}
      </TouchableOpacity>
    );
  };

  const renderContextMenuItem = (props: ListRenderItemInfo<INetwork>) => {
    const { item } = props;
    const actions = [
      { title: t('button-edit'), systemIcon: 'square.and.pencil' },
      item.pinned ? { title: t('button-unpin'), systemIcon: 'pin.slash' } : { title: t('button-pin'), systemIcon: 'pin' },
    ];

    const onActionPress = (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => {
      const { index } = e.nativeEvent;

      switch (index) {
        case 0:
          setEditNetwork(item);
          setTimeout(() => swiper.current?.scrollTo(1), 25);
          onEditing?.(true);
          break;
        case 1:
          startLayoutAnimation();
          item.pinned ? Networks.unpin(item) : Networks.pin(item);
          setTimeout(() => setNets(Networks.all));
          break;
        case 2:
          startLayoutAnimation();
          Networks.remove(item.chainId).then(() => setNets(Networks.all));
          break;
      }
    };

    return (
      <ContextMenu
        onPress={onActionPress}
        previewBackgroundColor={backgroundColor}
        actions={actions.concat(
          item.isUserAdded ? [{ title: t('button-remove'), destructive: true, systemIcon: 'trash.slash' } as any] : []
        )}
      >
        {renderItem(props)}
      </ContextMenu>
    );
  };

  const onSaveNetwork = (network?: INetwork) => {
    swiper.current?.scrollTo(0);
    onEditing?.(false);

    if (!network) return;
    Networks.update(network);
  };

  return (
    <SafeAreaProvider style={{ ...styles.safeArea, backgroundColor }}>
      <Swiper ref={swiper} showsPagination={false} showsButtons={false} loop={false} scrollEnabled={false}>
        <SafeViewContainer style={{ padding: 16 }}>
          <Text style={{ color: secondaryTextColor }} numberOfLines={1}>
            {title ?? t('modal-networks-switch')}
          </Text>
          <Separator style={{ marginVertical: 4, backgroundColor: borderColor }} />
          <FlatList
            ref={flatList}
            keyExtractor={(i) => `${i.chainId}`}
            data={nets}
            renderItem={useContextMenu ? renderContextMenuItem : renderItem}
            contentContainerStyle={{ paddingBottom: 36 }}
            style={{ marginHorizontal: -16, marginTop: -4, marginBottom: -36 }}
            onScrollToIndexFailed={({}) => {}}
          />
        </SafeViewContainer>

        <EditNetwork network={editNetwork} onDone={onSaveNetwork} />
      </Swiper>
    </SafeAreaProvider>
  );
});
