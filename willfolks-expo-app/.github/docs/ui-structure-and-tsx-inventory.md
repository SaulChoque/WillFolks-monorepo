# UI Structure & TSX Inventory

## 1) Árbol de pantallas (Expo Router)

```text
app/
├── _layout.tsx (RootLayout)
│   ├── Header global persistente (AppHeader)
│   ├── Stack: (tabs)
│   └── Stack: modal
├── modal.tsx
├── (tabs)/
│   ├── _layout.tsx (Tabs con botón central)
│   ├── index.tsx (Time)
│   ├── dashboard.tsx
│   ├── home.tsx (3D Model)
│   ├── activities.tsx
│   ├── account.tsx
│   └── settings.tsx
├── activity/
│   └── [activityId].tsx (detalle de actividad)
└── focus/
    └── [activityId].tsx (sesión de foco)
```

## 2) Árbol de componentes UI

```text
components/
├── layout/
│   └── app-header.tsx
├── activity/
│   ├── activity-card.tsx
│   ├── activity-metric-list.tsx
│   └── day-selector.tsx
├── alarm/
│   └── AlarmModal.tsx
├── dashboard/
│   └── recent-activity-card.tsx
├── time/
│   └── friend-time-card.tsx
├── ui/
│   ├── card.tsx
│   ├── collapsible.tsx
│   ├── floating-action-button.tsx
│   ├── icon-symbol.tsx
│   └── icon-symbol.ios.tsx
├── external-link.tsx
├── haptic-tab.tsx
├── hello-wave.tsx
├── parallax-scroll-view.tsx
├── themed-text.tsx
└── themed-view.tsx
```

## 3) Inventario detallado de cada TSX

### Rutas y layouts

- **app/\_layout.tsx**
  - Monta el `ThemeProvider` según `useColorScheme`.
  - Define navegación global con `Stack`.
  - Inyecta `AppHeader` como header persistente para todo el stack.
  - Renderiza `AlarmModal` cuando `useAlarm` detecta alarma activa.

- **app/(tabs)/\_layout.tsx**
  - Configura navegación por tabs.
  - Implementa barra inferior oscura con `tabBarShowLabel: false`.
  - Declara botón central personalizado (`sentiment_calm`) para la tab `home`.
  - Expone tabs: `index`, `dashboard`, `home`, `activities`, `account`, `settings`.

- **app/modal.tsx**
  - Pantalla modal de ejemplo.
  - Usa `ThemedView` y `ThemedText`.
  - Incluye `Link` para cerrar y volver.

- **app/(tabs)/index.tsx (Time)**
  - Muestra reloj en vivo y fecha con actualización cada segundo.
  - Lista zonas horarias de amistades (`FriendTimeCard`).
  - Incluye `FloatingActionButton` para acción futura.

- **app/(tabs)/dashboard.tsx**
  - Calcula actividades recientes desde `mock-data`.
  - Renderiza cards de actividad (`RecentActivityCard`).
  - Incluye saludo y avatar visual.

- **app/(tabs)/home.tsx (3D Model)**
  - Pantalla central para render 3D con `Canvas` de `@react-three/fiber/native`.
  - Crea malla 3D (`icosahedronGeometry`) y animación con `useFrame`.
  - Añade icono de felicidad (izquierda) con anillo de progreso circular.
  - Añade icono de racha (derecha).

- **app/(tabs)/activities.tsx**
  - Lista actividades existentes en `FlatList`.
  - Permite crear borrador de actividad (`ActivityDraftCard`).
  - Guarda/descarta borrador y lo convierte a modelo `Activity`.

- **app/(tabs)/account.tsx**
  - Muestra información de cuenta/perfil.
  - Secciones de métricas personales y relaciones.
  - Acción visual para borrar cuenta.

- **app/(tabs)/settings.tsx**
  - Centraliza switches de configuración de experiencia y alarmas.
  - Ajustes incluidos: hápticos, segundos en reloj, recordatorios, vibración.
  - Acceso directo a pantalla `account`.

- **app/activity/[activityId].tsx**
  - Pantalla de detalle por actividad dinámica.
  - Renderiza estado, métricas, días activos y opciones de notificación.
  - Botón para abrir sesión de foco (`/focus/[activityId]`).

- **app/focus/[activityId].tsx**
  - Pantalla/modal de enfoque activo.
  - Muestra título y tiempo principal de sesión.
  - Tema visual minimal oscuro.

### Componentes de layout/base

- **components/layout/app-header.tsx**
  - Header superior persistente.
  - Avatar (izquierda) navega a `/account`.
  - Botón de comentarios (derecha) sin acción funcional por ahora.

- **components/themed-view.tsx**
  - `View` con color dinámico light/dark.

- **components/themed-text.tsx**
  - `Text` con variantes tipográficas (`title`, `subtitle`, `link`, etc.).

- **components/parallax-scroll-view.tsx**
  - `ScrollView` con header parallax usando Reanimated.

- **components/external-link.tsx**
  - `Link` que abre navegador interno en nativo y pestaña en web.

- **components/haptic-tab.tsx**
  - Wrapper de botón de tab con feedback háptico en iOS.

- **components/hello-wave.tsx**
  - Texto animado de saludo (emoji) de demostración.

### Componentes de dominio

- **components/activity/activity-card.tsx**
  - Card expandible por actividad (`AccordionItem`).
  - Soporta variantes `alarm` y `timer` con campos específicos.
  - Incluye formularios de borrador con:
    - selección de tipo,
    - pickers fecha/hora (Android+iOS),
    - selector de app,
    - selector de música (`expo-document-picker`),
    - switches y guardado/cancelación.

- **components/activity/activity-metric-list.tsx**
  - Lista visual de métricas con icono, etiqueta y valor.

- **components/activity/day-selector.tsx**
  - Botones de días activos/inactivos con opción de toggle.

- **components/dashboard/recent-activity-card.tsx**
  - Card de actividad resumida para dashboard.
  - Resalta importe según tipo (`credit`, `debit`, `neutral`).

- **components/time/friend-time-card.tsx**
  - Card de timezone de amistad.
  - Calcula hora local por zona (`Intl.DateTimeFormat`).

- **components/alarm/AlarmModal.tsx**
  - Modal de alarma activa.
  - Intenta reproducir audio dinámicamente (`expo-av`) y vibración.
  - Botones de “Posponer 5 minutos” y “Parar”.

### Componentes UI reutilizables

- **components/ui/card.tsx**
  - Contenedor tipo tarjeta con modos `elevated`/`flat`.

- **components/ui/collapsible.tsx**
  - Sección colapsable con icono de flecha.

- **components/ui/floating-action-button.tsx**
  - FAB circular con estado visual `pressed`.

- **components/ui/icon-symbol.tsx**
  - Fallback Android/Web: mapea SF Symbols a Material Icons.

- **components/ui/icon-symbol.ios.tsx**
  - Implementación iOS basada en `expo-symbols` (`SymbolView`).

### Hooks en TSX con impacto UI

- **hooks/use-alarm.tsx**
  - Administra alarmas activas y planificación local/native.
  - Solicita permiso de notificaciones en Android >= 13.
  - Exposición de acciones `stop` y `snooze`.

## 4) Flujo de navegación visual actualizado

1. Cualquier pantalla renderiza header superior persistente.
2. Tap en avatar del header -> `/(tabs)/account`.
3. Botón de comentarios del header -> sin acción.
4. Barra inferior mantiene tabs laterales + botón central 3D (`home`).
5. Tab `settings` y tab `account` son rutas separadas.

## 5) Dependencias relevantes de UI/3D

- `@react-three/fiber` (render declarativo 3D)
- `three` (motor 3D)
- `expo-gl` (binding WebGL en Expo native)
- `@expo/vector-icons`, `react-native-reanimated`, `expo-router`
