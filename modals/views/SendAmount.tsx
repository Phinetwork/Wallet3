import React, { useRef } from 'react';

import AmountPad from './AmountPad';
import { IFungibleToken } from '../../models/Interfaces';
import Swiper from 'react-native-swiper';
import { TokenTransferring } from '../../viewmodels/transferring/TokenTransferring';
import Tokenlist from './TokenPlainList';
import { observer } from 'mobx-react-lite';

interface Props {
  onBack?: () => void;
  onNext?: () => void;
  vm: TokenTransferring;
}

export default observer(({ onNext, onBack, vm }: Props) => {
  const swiper = useRef<Swiper>(null);
  const themeColor = vm.network.color;

  return (
    <Swiper ref={swiper} scrollEnabled={false} showsButtons={false} showsPagination={false} loop={false}>
      <AmountPad
        onNext={onNext}
        onTokenPress={() => swiper.current?.scrollTo(1)}
        onBack={onBack}
        max={vm.token?.amount}
        token={vm.token!}
        onNumChanged={(n) => vm.setAmount(n)}
        disableButton={!vm.isValidAmount}
        themeColor={themeColor}
        initValue={vm.amount}
        network={vm.network}
      />

      <Tokenlist
        onBack={() => swiper.current?.scrollTo(0)}
        tokens={vm.allTokens}
        themeColor={themeColor}
        selectedToken={vm.token}
        network={vm.network}
        onTokenSelected={(token) => {
          swiper.current?.scrollTo(0);
          vm.setToken(token as IFungibleToken);
        }}
      />
    </Swiper>
  );
});
