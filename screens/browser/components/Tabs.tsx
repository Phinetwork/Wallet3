import { Dimensions, Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';

import { FlatGrid } from 'react-native-super-grid';
import { Ionicons } from '@expo/vector-icons';
import { NullableImage } from '../../../components';
import { ReactiveScreen } from '../../../utils/device';
import { StateViewModel } from '../MultiTabIndex';
import Theme from '../../../viewmodels/settings/Theme';
import i18n from '../../../i18n';
import { observer } from 'mobx-react-lite';

const calcTabWidth = () => {
  const { width } = ReactiveScreen;

  const NumOfColumns = Math.floor(width / 170);
  let TabWidth = (width - 16 * 2 - 16 * (NumOfColumns - 1)) / NumOfColumns;
  TabWidth = Platform.OS === 'android' ? TabWidth - 2 : TabWidth;

  return { TabWidth };
};

const WebTab = ({
  pageId,
  globalState,
  tabWidth,
  onRemovePress,
  listIndex,
  onPress,
  activeIndex,
}: {
  globalState: StateViewModel;
  pageId: number;
  listIndex: number;
  onPress?: (listIndex: number) => void;
  onRemovePress?: (pageId: number) => void;
  tabWidth: number;
  activeIndex: number;
}) => {
  const meta = globalState.pageMetas.get(pageId);
  const themeColor = '#000';
  const [snapshot, setSnapshot] = useState<string | undefined>(globalState.pageSnapshots.get(pageId));

  useEffect(() => {
    if (snapshot) return;

    const timer = setTimeout(
      () =>
        globalState.pageCaptureFuncs
          .get(pageId)?.()
          .then((data) => {
            setSnapshot(data);
            globalState.pageSnapshots.set(pageId, data);
          }),
      listIndex * 100
    );

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <TouchableOpacity
      onPress={() => onPress?.(listIndex)}
      style={{
        width: tabWidth,
        borderRadius: 12,
        borderBottomEndRadius: 7,
        borderBottomStartRadius: 7,
        backgroundColor: '#fff',
        shadowColor: `#00000060`,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowRadius: 3.14,
        shadowOpacity: 0.5,
        elevation: 5,
        borderWidth: activeIndex === listIndex ? 2.5 : 0,
        borderColor: 'dodgerblue',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingStart: 10,
          backgroundColor: themeColor,
          borderColor: themeColor,
          borderWidth: 1,
          borderTopEndRadius: 10,
          borderTopStartRadius: 10,

          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
          {meta && (
            <NullableImage
              imageBackgroundColor={themeColor}
              uri={meta?.icon}
              size={12}
              containerStyle={{ marginEnd: 8 }}
              imageRadius={2}
            />
          )}

          <Text style={{ color: 'white', fontWeight: '500', fontSize: 12, maxWidth: 81 }} numberOfLines={1}>
            {meta?.title ?? 'Blank Page'}
          </Text>
        </View>

        <TouchableOpacity
          style={{ paddingTop: 7, paddingBottom: 5, paddingEnd: 10, paddingStart: 16 }}
          onPress={() => onRemovePress?.(pageId)}
        >
          <Ionicons name="ios-close" color="#fff" size={15} />
        </TouchableOpacity>
      </View>

      <View
        style={{
          borderWidth: snapshot ? 0 : 1,
          height: 170,
          borderColor: themeColor,
          borderBottomEndRadius: 5,
          borderBottomStartRadius: 5,
        }}
      >
        {snapshot ? (
          <Image
            source={{ uri: snapshot }}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',

              borderBottomLeftRadius: 5,
              borderBottomRightRadius: 5,
            }}
          />
        ) : undefined}
      </View>
    </TouchableOpacity>
  );
};

export const WebTabs = observer(
  ({
    globalState,
    onJumpToPage,
    onRemovePage,
    onNewTab,
    activeIndex,
    onRemoveAll,
  }: {
    globalState: StateViewModel;
    onJumpToPage: (listIndex: number) => void;
    onRemovePage: (pageId: number) => void;
    onNewTab: () => void;
    onRemoveAll: () => void;
    activeIndex: number;
  }) => {
    const { backgroundColor, thirdTextColor, tintColor } = Theme;
    const [tabWidth, setTabWidth] = useState(calcTabWidth().TabWidth);
    const { t } = i18n;

    useEffect(() => {
      const handler = () => {
        const { TabWidth } = calcTabWidth();
        setTabWidth(TabWidth);
      };

      const event = Dimensions.addEventListener('change', handler);

      return () => {
        event.remove();
      };
    }, []);

    return (
      <View
        style={{
          maxHeight: 600,
          minHeight: 439,
          backgroundColor,
          borderTopEndRadius: 6,
          borderTopStartRadius: 6,
          width: '100%',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            zIndex: 10,
            left: 0,
            right: 0,
            paddingTop: 4,
            paddingEnd: 8,
            position: 'absolute',
            borderTopRightRadius: 6,
            borderTopLeftRadius: 6,
            backgroundColor: `${backgroundColor}e0`,
          }}
        >
          <TouchableOpacity
            onPress={onRemoveAll}
            style={{
              padding: 8,
              borderRadius: 10,
              borderWidth: 0,
              borderColor: tintColor,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="close-circle-outline" size={12} color={thirdTextColor} />
            <Text style={{ fontSize: 12, color: thirdTextColor, marginStart: 4, marginTop: -1 }}>{t('button-close-all')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onNewTab}
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            right: 16,
            bottom: 32,
            zIndex: 9,
            borderRadius: 100,
            width: 48,
            height: 48,
            backgroundColor: tintColor,
            shadowColor: `#00000060`,
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowRadius: 3.14,
            shadowOpacity: 0.75,
            elevation: 5,
          }}
        >
          <Ionicons name={'add-outline'} size={32} color={'#fff'} style={{ marginStart: 4, marginTop: 1 }} />
        </TouchableOpacity>

        <FlatGrid
          data={Array.from(globalState.pageMetas.keys())}
          keyExtractor={(i) => `Tab-${i}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 37, paddingTop: 20 }}
          itemDimension={tabWidth}
          spacing={16}
          renderItem={({ item, index }) => (
            <WebTab
              globalState={globalState}
              tabWidth={tabWidth}
              pageId={item}
              listIndex={index}
              onPress={onJumpToPage}
              onRemovePress={onRemovePage}
              activeIndex={activeIndex}
            />
          )}
        />
      </View>
    );
  }
);
