import { Feather, MaterialIcons } from '@expo/vector-icons';
import { StyleProp, StyleSheet, Text, TouchableHighlight, View, ViewStyle } from 'react-native';
import { borderColor, fontColor } from '../constants/styles';

import { BioType } from '../viewmodels/auth/Authentication';
import FaceID from '../assets/icons/app/FaceID.svg';
import FaceID_White from '../assets/icons/app/FaceID-white.svg';
import React from 'react';

export type NumpadChar = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0' | '.' | 'del' | 'clear';

interface Props {
  onPress: (value: NumpadChar) => void;
  disableDot?: boolean;
  onBioAuth?: () => void;
  bioType?: BioType;
  color?: string;
  mode: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
}

export default ({ onPress, onBioAuth, disableDot, bioType, color, mode, style }: Props) => {
  const numStyle = { ...viewStyles.num, color };
  const keyboardStyle = { ...viewStyles.keyboard, borderColor: color ?? borderColor };

  return (
    <View style={{ ...viewStyles.numpadContainer, borderColor: color ?? borderColor, ...(style as any) }}>
      <TouchableHighlight
        style={{ ...keyboardStyle, borderTopLeftRadius: 9.75 }}
        underlayColor={borderColor}
        onPressOut={(_) => onPress('1')}
      >
        <Text style={numStyle}>1</Text>
      </TouchableHighlight>

      <TouchableHighlight style={keyboardStyle} underlayColor={borderColor} onPressOut={(_) => onPress('2')}>
        <Text style={numStyle}>2</Text>
      </TouchableHighlight>

      <TouchableHighlight
        style={{ ...keyboardStyle, borderRightWidth: 0, borderTopRightRadius: 9.75 }}
        underlayColor={borderColor}
        onPressOut={(_) => onPress('3')}
      >
        <Text style={numStyle}>3</Text>
      </TouchableHighlight>

      <TouchableHighlight style={keyboardStyle} underlayColor={borderColor} onPressOut={(_) => onPress('4')}>
        <Text style={numStyle}>4</Text>
      </TouchableHighlight>

      <TouchableHighlight style={keyboardStyle} underlayColor={borderColor} onPressOut={(_) => onPress('5')}>
        <Text style={numStyle}>5</Text>
      </TouchableHighlight>

      <TouchableHighlight
        style={{ ...keyboardStyle, borderRightWidth: 0 }}
        underlayColor={borderColor}
        onPressOut={(_) => onPress('6')}
      >
        <Text style={numStyle}>6</Text>
      </TouchableHighlight>

      <TouchableHighlight style={keyboardStyle} underlayColor={borderColor} onPressOut={(_) => onPress('7')}>
        <Text style={numStyle}>7</Text>
      </TouchableHighlight>

      <TouchableHighlight style={keyboardStyle} underlayColor={borderColor} onPressOut={(_) => onPress('8')}>
        <Text style={numStyle}>8</Text>
      </TouchableHighlight>

      <TouchableHighlight
        style={{ ...keyboardStyle, borderRightWidth: 0 }}
        underlayColor={borderColor}
        onPressOut={(_) => onPress('9')}
      >
        <Text style={numStyle}>9</Text>
      </TouchableHighlight>

      {bioType ? (
        <TouchableHighlight
          style={{ ...keyboardStyle, borderBottomWidth: 0, borderBottomLeftRadius: 9.75 }}
          underlayColor={borderColor}
          onPressOut={(_) => onBioAuth?.()}
        >
          {bioType === 'fingerprint' ? (
            <MaterialIcons name="fingerprint" size={19} color={color} />
          ) : bioType === 'faceid' ? (
            mode === 'light' ? (
              <FaceID width={17} height={17} />
            ) : (
              <FaceID_White width={17} height={17} style={{ opacity: 0.7 }} />
            )
          ) : (
            <View />
          )}
        </TouchableHighlight>
      ) : (
        <TouchableHighlight
          style={{ ...keyboardStyle, borderBottomWidth: 0, borderBottomLeftRadius: 9.75 }}
          underlayColor={borderColor}
          onPressOut={(_) => onPress('.')}
          disabled={disableDot}
        >
          {disableDot ? <View /> : <Text style={numStyle}>.</Text>}
        </TouchableHighlight>
      )}

      <TouchableHighlight
        style={{ ...keyboardStyle, borderBottomWidth: 0 }}
        underlayColor={borderColor}
        onPressOut={(_) => onPress('0')}
      >
        <Text style={numStyle}>0</Text>
      </TouchableHighlight>

      <TouchableHighlight
        style={{ ...keyboardStyle, borderBottomWidth: 0, borderRightWidth: 0, borderBottomRightRadius: 10 }}
        underlayColor={borderColor}
        onPressOut={(_) => onPress('del')}
        onLongPress={(_) => onPress('clear')}
      >
        <Feather name="delete" size={20} color={color} />
      </TouchableHighlight>
    </View>
  );
};

const viewStyles = StyleSheet.create({
  numpadContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    borderColor,
    borderWidth: 1,
    overflow: 'hidden',
    flexWrap: 'wrap',
  },

  keyboard: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '33.333%',
    height: '25%',
    minHeight: 49,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor,
  },

  num: {
    fontSize: 20,
    color: fontColor,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export const DefaultNumpadHandler = ({
  value,
  state,
  setStateAction,
  passLength,
}: {
  value: NumpadChar;
  state: string;
  setStateAction: React.Dispatch<React.SetStateAction<string>>;
  passLength?: number;
}) => {
  if (value === 'del') {
    setStateAction(state.slice(0, -1));
    return;
  }

  if (value === 'clear') {
    setStateAction('');
    return;
  }

  if (state.length >= (passLength ?? 6)) return;

  setStateAction((pre) => pre + value);
};
