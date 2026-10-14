import type { ThreeToJSXElements } from '@react-three/fiber';
import type * as THREE from 'three';

declare module '@react-three/fiber' {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      primitive: any;
    }
  }
}
