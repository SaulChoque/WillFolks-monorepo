import { PropsWithChildren } from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, ViewStyle } from 'react-native';

interface FloatingActionButtonProps {
  onPress?: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
}

export function FloatingActionButton({ children, style, onPress }: PropsWithChildren<FloatingActionButtonProps>) {
  return (
    <Pressable
      style={({ pressed }) => [styles.base, style, pressed && styles.pressed]}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 14,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
