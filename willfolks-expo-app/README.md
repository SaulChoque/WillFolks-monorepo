# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## WillFolks: backend, native features and e2e

The app talks to [`willfolks-BE`](../willfolks-BE) (NestJS) backed by [`willfolks-database`](../willfolks-database) (Postgres in Docker).

```bash
(cd ../willfolks-database && docker compose up --detach --wait)
(cd ../willfolks-BE && npm install && npm run start:dev)
npx expo run:android        # native build: the app is not usable in Expo Go
```

The API URL defaults to the deployed backend (`https://api.willfolks.bamp.lat`). To use the local one
from the steps above, set `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000` (Android emulator) in `.env`
(see `.env.example`).

| Feature | Where | How |
| --- | --- | --- |
| Alarms | `modules/willfolks-native` (Kotlin), `lib/native/alarms.ts` | `AlarmManager.setAlarmClock`, a foreground service that rings on the alarm stream, full-screen notification, reschedule on boot. Outcomes are stored on the device until the backend has them. |
| App usage | `modules/willfolks-native`, `lib/native/usage.ts` | `UsageStatsManager` events (needs "Usage access"), installed-app list for the goal form. |
| Widget | `modules/willfolks-native`, `lib/native/widget.ts` | `AppWidgetProvider` showing escrow, streak, goals and next alarm. |
| Location | `lib/native/location.ts` | `expo-location`: check-in with the current position, geofencing task when "all the time" is granted. |
| Camera | `app/proof/[activityId].tsx`, `lib/native/photos.ts` | `expo-camera` for proofs, `expo-image-picker` for the avatar. |
| Notifications | `lib/native/notifications.ts` | `expo-notifications`: weekly local reminders per goal, result banners. |

`components/system/app-sync.tsx` keeps backend, store and device in step. After changing
anything under `modules/` or the plugins in `app.json`, rebuild with `npx expo run:android`.

`e2e/onboarding-and-first-goal.yaml` is a Maestro flow over the `testID`s used across the screens.

## On-chain with TilcAI (e2e)

With the backend's `TILCAI_ENABLED=true` the wallet screen shows, besides the faucet, **Buy USDC with QR** and a
**smart account** card. Buying with QR (`app/wallet/buy.tsx`): the user picks an amount, the backend quotes it at
11.89 Bs per dollar and has TilcAI issue a Bolivian bank QR (QR Simple); the app redraws that QR in its own style
(`components/wallet/bank-qr.tsx`: ink on the acid plate, coin badge in the centre, same content) and polls until the
bank pays it, then the USDC arrives in the user's wallet on Monad. `e2e/buy-usdc-qr.yaml` walks it end to end. For the
smart account, the app creates a P-256 key (`lib/smart-account.ts`, kept in the secure store, never sent) and the backend asks
TilcAI to issue a contract account for it on Monad. AI goals get their verdict through a paid x402 call.

`e2e/onchain-tilcai.yaml` walks all of it with Maestro on the emulator (sign-up → faucet → smart account →
AI goal whose stake the phone signs → camera proof judged over x402). Chain-bound calls use a 120 s timeout
(`CHAIN_TIMEOUT_MS` in `lib/api.ts`): a confirmed transaction takes longer than a database read.

```bash
N=$(date +%s)
maestro test e2e/onchain-tilcai.yaml -e EMAIL=onchain$N@willfolks.test -e USERNAME=oc$N
```
