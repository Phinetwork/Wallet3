import * as Animatable from 'react-native-animatable';

import { StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

import { BreathAnimation } from '../utils/animations';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import SwipeButton from 'rn-swipe-button';
import Theme from '../viewmodels/settings/Theme';
import { isAndroid } from '../utils/platform';
import { themeColor } from '../constants/styles';

export interface ButtonProps {
  style?: StyleProp<ViewStyle>;
  txtStyle?: StyleProp<TextStyle>;
  title?: string;
  icon?: () => JSX.Element;
  disabled?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onSwipeSuccess?: () => void;
  themeColor?: string;
  reverse?: boolean;
}

export default (props: ButtonProps) => {
  const { disabled, reverse, themeColor, onLongPress, onPress, onSwipeSuccess, title } = props;

  const backgroundColor: any = disabled
    ? Theme.isLightMode
      ? '#D7D7D7'
      : '#5A5A5A'
    : reverse
    ? 'transparent'
    : props.themeColor || (props?.style as ViewStyle)?.backgroundColor || styles.default.backgroundColor;

  const buttonStyle: StyleProp<ViewStyle> = {
    ...styles.default,
    ...((props?.style as any) || {}),
    backgroundColor: reverse && disabled ? 'transparent' : backgroundColor,
    borderColor: reverse ? (disabled ? 'lightgrey' : themeColor) : 'transparent',
    borderWidth: reverse ? 1 : 0,
  };

  const txtStyle = {
    ...styles.text,
    color: reverse ? (disabled ? 'lightgrey' : themeColor) : '#fff',
    ...((props?.txtStyle as any) || {}),
    marginStart: props.icon ? 8 : 0,
  };

  const arrowIcon = () => <Ionicons name="arrow-forward" size={19} color={backgroundColor} style={{}} />;

  return onSwipeSuccess ? (
    <View style={{ ...((props?.style as any) || {}), backgroundColor, borderRadius: 7, height: 42 }}>
      <Animatable.View
        animation={disabled ? undefined : BreathAnimation}
        duration={2200}
        iterationCount={'infinite'}
        easing="ease-in-out"
        style={{
          flexDirection: 'row',
          position: 'absolute',
          alignSelf: 'center',
          height: 42,
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          paddingStart: 18,
          paddingEnd: 4,
        }}
      >
        {props.icon?.()}
        <Text style={{ ...txtStyle, maxWidth: '100%' }} numberOfLines={1}>
          {title}
        </Text>
      </Animatable.View>

      <SwipeButton
        disabled={disabled}
        disabledRailBackgroundColor="transparent"
        railFillBackgroundColor="transparent"
        disabledThumbIconBackgroundColor="#fff"
        shouldResetAfterSuccess={!disabled}
        resetAfterSuccessAnimDuration={5000}
        swipeSuccessThreshold={95}
        containerStyles={{
          backgroundColor: 'transparent',
          margin: 0,
          padding: 0,
          borderRadius: 7,
          borderWidth: 0,
          height: 42,
          paddingHorizontal: 8,
        }}
        thumbIconStyles={{ backgroundColor: 'transparent', borderRadius: 6, borderWidth: 0, height: 32 }}
        titleStyles={txtStyle}
        onSwipeSuccess={onSwipeSuccess}
        railBackgroundColor="transparent"
        railStyles={{
          maxWidth: '100%',
          borderWidth: 0,
          borderColor: 'black',
          backgroundColor: backgroundColor,
          backfaceVisibility: 'hidden',
          borderRadius: 5,
          margin: 0,
          padding: 0,
          marginEnd: 4,
        }}
        thumbIconComponent={arrowIcon as any}
        thumbIconBackgroundColor="#fff"
        thumbIconWidth={34}
        titleColor="#fff"
        height={32}
        title={''}
      />
    </View>
  ) : (
    <TouchableOpacity
      activeOpacity={0.5}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={[
        buttonStyle,
        {
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      {props.icon?.()}
      <Text style={txtStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  default: {
    borderRadius: 7,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 42,
    backgroundColor: themeColor,
  },

  text: {
    color: 'white',
    fontWeight: '500',
    textTransform: 'capitalize',
    fontSize: 17,
    marginTop: isAndroid ? -2.5 : undefined,
  },
});
