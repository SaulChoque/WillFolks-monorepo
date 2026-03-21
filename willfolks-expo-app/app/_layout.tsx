import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import AlarmModal from '@/components/alarm/AlarmModal';
import useAlarm from '@/hooks/use-alarm';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { activeAlarm, snooze, stop } = useAlarm();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <AlarmModal visible={Boolean(activeAlarm)} activity={activeAlarm} onSnooze={snooze} onStop={stop} />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
