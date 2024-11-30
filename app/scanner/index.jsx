import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  Clipboard,
  Linking,
  useColorScheme,
  PermissionsAndroid,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import WifiManager from "react-native-wifi-reborn";
import * as Calendar from "react-native-add-calendar-event";
import Icon from "react-native-vector-icons/MaterialIcons";
import { StatusBar } from "expo-status-bar";

function capitalizeFirstWord(string) {
  if (!string) return "QR Code";
  if (string == "raw") return "QR Code";
  return string.charAt(0).toUpperCase() + string.slice(1);
}
const parseDate = (dateStr) => {
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6) - 1; // Months are 0-indexed in JS Date
  const day = dateStr.substring(6, 8);
  const hour = dateStr.substring(9, 11);
  const minute = dateStr.substring(11, 13);
  const second = dateStr.substring(13, 15);
  return new Date(year, month, day, hour, minute, second);
};

export default function QrDataDisplay() {
  const [data, setData] = useState();
  const { rawData,realData } = useLocalSearchParams();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  let dData;


  const parseQRCodeData = (data) => {
    if (data.startsWith("http://") || data.startsWith("https://")) {
      dData = { Url: data };
      return { type: "url", content: data };
    } else if (data.startsWith("WIFI:")) {
      const ssid = data.match(/S:(.*?);/)[1];
      const password = data.match(/P:(.*?);/)[1];
      dData = { ssid, password };
      return { type: "wifi", ssid, password };
    } else if (data.startsWith("BEGIN:VEVENT")) {
      const title = data.match(/SUMMARY:(.*?)(?:\n|$)/)[1];
      let startDate = data.match(/DTSTART:(.*?)(?:\n|$)/)[1];
      let endDate = data.match(/DTEND:(.*?)(?:\n|$)/)[1];
      dData = {
        title,
        startDate: parseDate(startDate).toLocaleString(),
        endDate: parseDate(endDate).toLocaleString(),
      };
      startDate = parseDate(startDate).toISOString();
      endDate = parseDate(endDate).toISOString();
      return { type: "calendar", title, startDate, endDate };
    } else if (data.startsWith("mailto:")) {
      const email = data.replace("mailto:", "").trim();
      dData = { email };
      return { type: "email", email };
    } else if (data.startsWith("tel:")) {
      const phone = data.replace("tel:", "").trim();
      dData = { phone };
      return { type: "phone", phone };
    } else if (data.startsWith("SMSTO:")) {
      const [phone, message] = data.replace("SMSTO:", "").split(":");
      dData = { phone, message };
      return { type: "sms", phone, message };
    }
    dData = { data };
    return { type: "raw", content: data };
  };

  const qrData = parseQRCodeData(rawData);
  useEffect(() => {
    navigation.setOptions({
      title: `${capitalizeFirstWord(qrData.type)}`,
      headerStyle: {
        backgroundColor: "#8c11e4",
      },
      headerTintColor: "#FFF",
    });

    setData(dData);
  }, [rawData]);

  const addEventToCalendar = async (title, startDate, endDate) => {
    try {
      const eventConfig = {
        title,
        startDate,
        endDate,
        notes: "QRScanner",
      };

      Calendar.presentEventCreatingDialog(eventConfig)
        .then(() =>
          Alert.alert(
            "Event Added",
            "The event has been added to your calendar."
          )
        )
        .catch((error) =>
          Alert.alert("Error", `Failed to create event: ${error.message}`)
        );
    } catch (error) {
      Alert.alert("Error", `Failed to add the event: ${error.message}`);
    }
  };

  const handleAction = async (action) => {
    const {
      type,
      content,
      ssid,
      password,
      title,
      startDate,
      endDate,
      email,
      phone,
      message,
    } = qrData;

    switch (action) {
      case "open":
        if (type === "url") {
          Linking.openURL(content).catch((err) =>
            Alert.alert("Error", `Failed to open URL: ${err.message}`)
          );
        }
        break;
      case "copy":
        Clipboard.setString(
          content || password || title || email || phone || message || ""
        );
        Alert.alert("Copied", "Content copied to clipboard.");
        break;
      case "share":
        await Share.share({
          message: realData
        });
        break;
      case "connectWifi":
        if (type === "wifi") {
          try {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              {
                title: "Location permission is required for WiFi connections",
                message:
                  "This app needs location permission as this is required  " +
                  "to scan for wifi networks.",
                buttonNegative: "DENY",
                buttonPositive: "ALLOW",
              }
            );
            if (granted) {
              await WifiManager.connectToProtectedSSID(
                ssid,
                password,
                false,
                false
              );

              Alert.alert("Connected", `Successfully connected to ${ssid}`);
            }
          } catch (error) {
            Alert.alert(
              "Error",
              `Failed to connect to Wi-Fi: ${error.message}`
            );
          }
        }
        break;
      case "addCalendar":
        if (type === "calendar") {
          await addEventToCalendar(title, startDate, endDate);
        }
        break;
      case "sendEmail":
        if (type === "email") {
          Linking.openURL(`mailto:${email}`).catch((err) =>
            Alert.alert("Error", `Failed to open email client: ${err.message}`)
          );
        }
        break;
      case "call":
        if (type === "phone") {
          Linking.openURL(`tel:${phone}`).catch((err) =>
            Alert.alert("Error", `Failed to make a call: ${err.message}`)
          );
        }
        break;
      case "sendSMS":
        if (type === "sms") {
          Linking.openURL(`sms:${phone}?body=${message}`).catch((err) =>
            Alert.alert("Error", `Failed to send SMS: ${err.message}`)
          );
        }
        break;
      case "searchWeb":
        if (type === "raw") {
          Linking.openURL(
            `https://www.google.com/search?q=${encodeURIComponent(content)}`
          ).catch((err) =>
            Alert.alert("Error", `Failed to search the web: ${err.message}`)
          );
        }
        break;
      default:
        break;
    }
  };

  const renderQRContent = () => {
    if (data) {
      return (
        <View style={styles.dataItem}>
          {Object.entries(data).map(([key, value]) => (
            <Text
              key={key}
              style={[
                styles.text,
                { color: colorScheme === "light" ? "#121212" : "#FFFFFF" },
              ]}
            >
              {value}
            </Text>
          ))}
        </View>
      );
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === "dark" ? "#121212" : "#FFFFFF" },
      ]}
    >
      <StatusBar backgroundColor="#8c11e4" style="light" />
      {/* Header */}
      {/* <View style={styles.header}>
        <Text
          style={[
            styles.headerText,
            { color: colorScheme === "dark" ? "#BB86FC" : "#8c11e4" },
          ]}
        >
          QR Code Type: {qrData.type || "No Data"}
        </Text>
        <Text
          style={[
            styles.detailsText,
            { color: colorScheme === "dark" ? "#FFFFFF" : "#000000" },
          ]}
        >
          {JSON.stringify(data, null, 2)}
        </Text>
      </View> */}
      {/* Content */}
      <View style={styles.dataContainer}>
        {/* {qrData.type === "url" && <Icon name="link" size={40} color="#8c11e4" />}
        {qrData.type === "wifi" && <Icon name="wifi" size={40} color="#8c11e4" />}
        {qrData.type === "calendar" && (
          <Icon name="event" size={40} color="#8c11e4" />
        )}
        {qrData.type === "email" && (
          <Icon name="email" size={40} color="#8c11e4" />
        )}
        {qrData.type === "phone" && (
          <Icon name="phone" size={40} color="#8c11e4" />
        )}
        {qrData.type === "sms" && <Icon name="sms" size={40} color="#8c11e4" />}
        {qrData.type === "raw" && (
          <Icon name="search" size={40} color="#8c11e4" />
        )} */}
        {renderQRContent()}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          {qrData.type === "url" && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#8c11e4" }]}
              onPress={() => handleAction("open")}
            >
              <Icon name="open-in-browser" size={20} color="#fff" />
              <Text style={styles.buttonText}>Open</Text>
            </TouchableOpacity>
          )}
          {qrData.type === "wifi" && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#8c11e4" }]}
              onPress={() => handleAction("connectWifi")}
            >
              <Icon name="wifi" size={20} color="#fff" />
              <Text style={styles.buttonText}>Connect</Text>
            </TouchableOpacity>
          )}
          {qrData.type === "calendar" && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#8c11e4" }]}
              onPress={() => handleAction("addCalendar")}
            >
              <Icon name="event" size={20} color="#fff" />
              <Text style={styles.buttonText}>Add Event</Text>
            </TouchableOpacity>
          )}
          {qrData.type === "raw" && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#8c11e4" }]}
              onPress={() => handleAction("searchWeb")}
            >
              <Icon name="search" size={20} color="#fff" />
              <Text style={styles.buttonText}>Search Web</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#8c11e4" }]}
            onPress={() => handleAction("copy")}
          >
            <Icon name="content-copy" size={20} color="#fff" />
            <Text style={styles.buttonText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#8c11e4" }]}
            onPress={() => handleAction("share")}
          >
            <Icon name="share" size={20} color="#fff" />
            <Text style={styles.buttonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    position: "absolute",
    top: 10,
    left: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  detailsText: {
    marginTop: 5,
    fontSize: 14,
  },
  dataContainer: {
    flex: 1,
  },
  dataItem: {
    marginBottom: 14,
  },
  text: {
    fontSize: 16,
    marginVertical: 2,
    // textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 5,
    margin: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 5,
  },
});
