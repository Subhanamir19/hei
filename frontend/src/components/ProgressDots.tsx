import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../theme/tokens';

interface ProgressDotsProps {
  total: number;
  current: number;
}

export const ProgressDots: React.FC<ProgressDotsProps> = ({ total, current }) => {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, idx) => {
        const active = idx < current;
        return (
          <View
            key={idx}
            style={[
              styles.dot,
              active && styles.dotActive,
              idx !== total - 1 ? { marginRight: spacing.xs } : null,
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  dot: {
    flex: 1,
    height: 6,
    borderRadius: radii.sm,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.neonMint,
  },
});
