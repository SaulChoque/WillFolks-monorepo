import { t } from "@/i18n";
import { MaterialIcons } from "@expo/vector-icons";
import { Canvas, useFrame } from "@react-three/fiber/native";
import React, { useEffect, useMemo } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import {
  AmbientLight,
  DirectionalLight,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
} from "three";

const Primitive = "primitive" as unknown as React.ComponentType<{
  object: unknown;
}>;

function CalmCharacter() {
  const mesh = useMemo(() => {
    const geometry = new IcosahedronGeometry(1, 1);
    const material = new MeshStandardMaterial({
      color: "#8b5cf6",
      roughness: 0.3,
      metalness: 0.2,
    });
    const nextMesh = new Mesh(geometry, material);
    nextMesh.scale.setScalar(1.1);
    return nextMesh;
  }, []);

  useEffect(() => {
    return () => {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((item) => item.dispose());
      } else {
        mesh.material.dispose();
      }
    };
  }, [mesh]);

  useFrame((_state, delta) => {
    mesh.rotation.y += delta * 0.7;
    mesh.rotation.x += delta * 0.15;
  });

  return <Primitive object={mesh} />;
}

function SceneLights() {
  const ambient = useMemo(() => new AmbientLight("#ffffff", 0.65), []);
  const directional = useMemo(() => {
    const light = new DirectionalLight("#ffffff", 1.1);
    light.position.set(2, 3, 5);
    return light;
  }, []);

  return (
    <>
      <Primitive object={ambient} />
      <Primitive object={directional} />
    </>
  );
}

export default function Home3DTabScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.progressShell}>
            <View style={styles.progressRing}>
              <View style={styles.progressCenter}>
                <MaterialIcons
                  name="sentiment-satisfied-alt"
                  size={30}
                  color="#111111"
                />
              </View>
            </View>
            <Text style={styles.badgeLabel}>{t("home3d.mood")}</Text>
          </View>

          <View style={styles.streakBadge}>
            <MaterialIcons name="whatshot" size={28} color="#111111" />
            <Text style={styles.badgeLabel}>{t("home3d.streak")}</Text>
          </View>
        </View>

        <View style={styles.modelCard}>
          <Text style={styles.modelTitle}>{t("home3d.petTitle")}</Text>
          <View style={styles.canvasContainer}>
            <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
              <SceneLights />
              <CalmCharacter />
            </Canvas>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 110,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  progressShell: {
    alignItems: "center",
  },
  progressRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 5,
    borderColor: "rgba(17,17,17,0.14)",
    borderTopColor: "#22c55e",
    borderRightColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  progressCenter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  streakBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
  },
  badgeLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(17,17,17,0.65)",
  },
  modelCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    padding: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 8,
  },
  modelTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 12,
  },
  canvasContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
  },
});
