import type { HomeActivity } from '@/types/home';
import React, { useEffect, useRef } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';


interface Props {
  visible: boolean;
  activity: HomeActivity | null;
  onSnooze: () => void;
  onStop: () => void;
}

export default function AlarmModal({ visible, activity, onSnooze, onStop }: Props) {
  const soundRef = useRef<any | null>(null);

  useEffect(() => {
    let mounted = true;

    async function startSoundAndVibrate() {
      // Dynamic require of expo-av to avoid runtime crash when native module isn't available
      try {
        const ExpoAV = await import('expo-av');
        const Audio = ExpoAV?.Audio;
        if (Audio && Audio.Sound) {
          try {
            const asset = require('../../assets/alarm.mp3');
            if (Audio.setAudioModeAsync) {
              Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false }).catch(() => {});
            }
            const { sound } = await Audio.Sound.createAsync(asset, {
              shouldPlay: true,
              isLooping: true,
              volume: 1.0,
            });
            soundRef.current = sound;
          } catch {
            // audio file missing or playback failed
          }
        }
      } catch {
        // expo-av native module not available; ignore so the app can run.
      }

      // Start vibration if enabled on activity
      if (activity?.type === 'alarm' && activity.alarmSettings.vibrationEnabled) {
        Vibration.vibrate([1000, 500], true);
      }
    }

    if (visible && activity && mounted) {
      // start sound and vibration (audio loaded dynamically inside function)
      startSoundAndVibrate();
    }

    return () => {
      mounted = false;
      // cleanup sound
      (async () => {
        if (soundRef.current) {
          try {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
          } catch {
            // ignore
          }
          soundRef.current = null;
        }
        // stop vibration
        Vibration.cancel();
      })();
    };
  }, [visible, activity]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent={true}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>{activity?.title ?? 'Alarm'}</Text>
          <Text style={styles.time}>{activity && activity.type === 'alarm' ? new Date(activity.alarmSettings.alarmTime).toLocaleTimeString() : ''}</Text>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={[styles.button, styles.snooze]} onPress={onSnooze}>
              <Text style={styles.buttonText}>Posponer 5 minutos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.stop]} onPress={onStop}>
              <Text style={styles.buttonText}>Parar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>Puedes bloquear la pantalla; la alarma seguirá sonando mientras la app esté en primer plano.</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '90%',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  time: {
    color: '#fff',
    fontSize: 28,
    marginBottom: 24,
  },
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  snooze: {
    backgroundColor: '#3b82f6',
  },
  stop: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  hint: {
    color: '#aaa',
    marginTop: 18,
    fontSize: 12,
    textAlign: 'center',
  },
});
