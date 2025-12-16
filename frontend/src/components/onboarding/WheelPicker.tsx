import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../theme/tokens';

interface WheelPickerProps<T> {
  data: readonly T[];
  renderLabel?: (item: T) => string;
  selectedValue: T;
  onChange: (value: T) => void;
  itemHeight?: number;
  centeredHighlight?: boolean;
}

const DEFAULT_HEIGHT = 44;

export const WheelPicker = <T,>({
  data,
  renderLabel = (item) => String(item),
  selectedValue,
  onChange,
  itemHeight = DEFAULT_HEIGHT,
  centeredHighlight = true,
}: WheelPickerProps<T>) => {
  const scrollRef = useRef<ScrollView>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const index = data.findIndex((item) => item === selectedValue);
    if (index >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ y: index * itemHeight, animated: false });
      setReady(true);
    }
  }, [data, selectedValue, itemHeight]);

  return (
    <View style={[styles.container, { height: itemHeight * 5 }]}>
      {centeredHighlight ? (
        <View style={[styles.overlay, { top: itemHeight * 2, height: itemHeight }]} />
      ) : null}
      <ScrollView
        ref={scrollRef}
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
        contentContainerStyle={{ paddingVertical: itemHeight * 2 }}
      >
        {data.map((item, idx) => {
          const selected = ready && item === selectedValue;
          return (
            <View key={idx} style={[styles.item, { height: itemHeight }]}>
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {renderLabel(item)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
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
    backgroundColor: '#1E1E1E',
    opacity: 0.65,
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
