import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { Stack, useFocusEffect } from "expo-router";
import {
  AppState,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";
import { Overlay } from "./Overlay";
import { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // For navigation
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Home() {
  // const qrLock = useRef(false);
  // const appState = useRef(AppState.currentState);
  const [torchEnabled, setTorchEnabled] = useState(false);
  // const [zoomValue, setZoomValue] = useState(0);
  const [cameraFacing, setCameraFacing] = useState<CameraType>("back");
  const [firstRender, setFirstRender] = useState(true);
  const { top } = useSafeAreaInsets();
  useFocusEffect(
    useCallback(() => {
      setFirstRender(true);
    }, [setFirstRender])
  );

  const [permission, requestPermission] = useCameraPermissions();
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);
  const router = useRouter(); // Use Expo Router

  // useEffect(() => {
  //   const subscription = AppState.addEventListener("change", (nextAppState) => {
  //     if (
  //       appState.current.match(/inactive|background/) &&
  //       nextAppState === "active"
  //     ) {
  //       qrLock.current = false;
  //     }
  //     appState.current = nextAppState;
  //   });

  //   return () => {
  //     subscription.remove();
  //   };
  // }, []);

  const handleTorchToggle = () => {
    setTorchEnabled((prev) => !prev);
  };

  const handleFlipCamera = () => {
    setCameraFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  // const handleZoomValue = (value: any) => {
  //   setZoomValue(value);
  // };

  const handleBarcodeScanned = (data: any) => {
    // console.log(data);
    if (firstRender) {
      setFirstRender(false);
      router.push({
        pathname: "/scanner",
        params: { rawData: data.raw, realData: data.data }, // Pass the scanned data
      });
    }
  };

  return (
    <SafeAreaView style={[StyleSheet.absoluteFillObject,{top : top}]}>
      <Stack.Screen
        options={{
          title: "",
          headerShown: false,
        }}
      />
      {Platform.OS === "ios" ? (
        <StatusBar hidden />
      ) : (
        <StatusBar backgroundColor={"#000"} barStyle={"light-content"} />
      )}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={cameraFacing}
        // zoom={zoomValue}
        enableTorch={torchEnabled}
        onBarcodeScanned={handleBarcodeScanned} // Navigate on scan
      />
      <Overlay />
      <View style={styles.controlsContainer}>
        <View style={styles.iconControls}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleTorchToggle}
          >
            <Ionicons
              name={torchEnabled ? "flash" : "flash-off"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleFlipCamera}
          >
            <Ionicons name="camera-reverse-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  controlsContainer: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  iconControls: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "60%",
  },
  iconButton: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 15,
    borderRadius: 50,
  },
});
