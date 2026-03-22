import { AppColors } from "@/constants/theme";
import { t } from "@/i18n";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Image, SafeAreaView, StyleSheet, Text, View } from "react-native";
// import { Canvas, useFrame } from "@react-three/fiber/native";
// import { Asset } from "expo-asset";
// import {
//   AmbientLight,
//   Box3,
//   DirectionalLight,
//   IcosahedronGeometry,
//   Mesh,
//   MeshStandardMaterial,
//   Object3D,
//   Vector3,
// } from "three";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// import glepBin from "../../assets/3d/Glep.bin";
// import glepGltf from "../../assets/3d/Glep.gltf";

const TENNA_GIF = require("../../assets/gif/deltarune-tenna.gif");

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
                  color={AppColors.lilac.iconStrong}
                />
              </View>
            </View>
            <Text style={styles.badgeLabel}>{t("home3d.mood")}</Text>
          </View>

          <View style={styles.streakBadge}>
            <MaterialIcons
              name="whatshot"
              size={28}
              color={AppColors.lilac.iconStrong}
            />
            <Text style={styles.badgeLabel}>{t("home3d.streak")}</Text>
          </View>
        </View>

        <View style={styles.modelCard}>
          <Text style={styles.modelTitle}>{t("home3d.petTitle")}</Text>
          <View style={styles.canvasContainer}>
            {/* Render 3D desactivado por problemas de carga en Android.
                Se reemplaza por GIF local. */}
            <Image source={TENNA_GIF} style={styles.gif} resizeMode="contain" />
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
    borderColor: AppColors.lilac.border,
    borderTopColor: AppColors.lilac.icon,
    borderRightColor: AppColors.lilac.icon,
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
    borderColor: AppColors.lilac.border,
  },
  badgeLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.lilac.textSecondary,
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
    color: AppColors.lilac.textPrimary,
    marginBottom: 12,
  },
  canvasContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: AppColors.lilac.border,
    alignItems: "center",
    justifyContent: "center",
  },
  gif: {
    width: "100%",
    height: "100%",
  },
});
