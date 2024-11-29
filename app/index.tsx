import Slider from "@react-native-community/slider";
import { CameraView ,CameraType, useCameraPermissions} from "expo-camera";
import { Stack } from "expo-router";
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
import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // For navigation

export default function Home() {
  const qrLock = useRef(false);
  const appState = useRef(AppState.currentState);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoomValue, setZoomValue] = useState(0);
  const [cameraFacing, setCameraFacing] = useState<CameraType>("back");
  // const [permission, requestPermission] = useCameraPermissions();
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

  const handleZoomValue = (value : any) => {
    setZoomValue(value);
  };

  const handleBarcodeScanned = (data : any) => {
    // console.log(data);
    // if (!qrLock.current) {
    //   qrLock.current = true;
      router.push({
        pathname: "/scanner",
        params: { rawData : data.raw, data : data.data }, // Pass the scanned data
      });
    // }
  };

  return (
    <SafeAreaView style={StyleSheet.absoluteFillObject}>
      <Stack.Screen
        options={{
          title: "QR Scanner",
          headerShown: false,
        }}
      />
      {Platform.OS === "ios" ? <StatusBar hidden /> : <StatusBar backgroundColor={"#000"} />}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={cameraFacing}
        zoom={zoomValue}
        enableTorch={torchEnabled}
        onBarcodeScanned={handleBarcodeScanned} // Navigate on scan
      />
      <Overlay />
      <View style={styles.controlsContainer}>
        <View style={styles.iconControls}>
          <TouchableOpacity style={styles.iconButton} onPress={handleTorchToggle}>
            <Ionicons
              name={torchEnabled ? "flash" : "flash-off"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleFlipCamera}>
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
