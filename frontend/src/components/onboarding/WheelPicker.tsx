import React, { useEffect, useRef } from 'react';
import { FlatList, ListRenderItem, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../theme/tokens';

interface WheelPickerProps<T> {
  data: readonly T[];
  renderLabel?: (item: T) => string;
  selectedValue: T;
  onChange: (value: T) => void;
  itemHeight?: number;
}

const DEFAULT_HEIGHT = 44;

export const WheelPicker = <T,>({
  data,
  renderLabel = (item) => String(item),
  selectedValue,
  onChange,
  itemHeight = DEFAULT_HEIGHT,
}: WheelPickerProps<T>) => {
  const listRef = useRef<FlatList<T>>(null);

  useEffect(() => {
    const index = data.findIndex((item) => item === selectedValue);
    if (index >= 0) {
      listRef.current?.scrollToOffset({
        offset: index * itemHeight,
        animated: false,
      });
    }
  }, [data, selectedValue, itemHeight]);

  const renderItem: ListRenderItem<T> = ({ item }) => {
    const selected = item === selectedValue;
    return (
      <View style={[styles.item, { height: itemHeight }]}>
        <Text style={[styles.label, selected && styles.labelSelected]}>{renderLabel(item)}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { height: itemHeight * 5 }]}>
      <View style={[styles.overlay, { top: itemHeight * 2, height: itemHeight }]} />
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onMomentumScrollEnd={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          const index = Math.round(offsetY / itemHeight);
          const value = data[index];
          if (value !== undefined && value !== selectedValue) {
            onChange(value);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#142038',
    opacity: 0.5,
    borderRadius: 12,
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
  },
  labelSelected: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
  },
});
