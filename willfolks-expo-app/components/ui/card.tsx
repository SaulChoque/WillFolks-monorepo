import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  elevated?: boolean;
}

export function Card({ children, style, elevated = true, ...rest }: PropsWithChildren<CardProps>) {
  return (
    <View
      style={[styles.base, elevated ? styles.elevated : styles.flat, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  elevated: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 12,
  },
  flat: {
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.08)',
  },
});
