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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import WifiManager from "react-native-wifi-reborn";
import * as Calendar from "react-native-add-calendar-event";
import Icon from "react-native-vector-icons/MaterialIcons";

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
  // const router = useRouter();
  const [data, setData] = useState();
  const { rawData } = useLocalSearchParams();
  let dData;
  const parseQRCodeData = (data) => {
    if (data.startsWith("http://") || data.startsWith("https://")) {
      dData = {
        Url: data,
      };
      return { type: "url", content: data };
    } else if (data.startsWith("WIFI:")) {
      const ssid = data.match(/S:(.*?);/)[1];
      const password = data.match(/P:(.*?);/)[1];
      dData = {
        ssid: ssid,
        password: password,
      };
      return { type: "wifi", ssid, password };
    } else if (data.startsWith("BEGIN:VEVENT")) {
      const title = data.match(/SUMMARY:(.*?)(?:\n|$)/)[1];
      let startDate = data.match(/DTSTART:(.*?)(?:\n|$)/)[1];
      let endDate = data.match(/DTEND:(.*?)(?:\n|$)/)[1];
      dData = {
        title: title,
        startDate: parseDate(startDate).toLocaleString(),
        endDate: parseDate(endDate).toLocaleString(),
      };
      startDate = parseDate(startDate).toISOString();
      endDate = parseDate(endDate).toISOString();
      return { type: "calendar", title, startDate, endDate };
    } else if (data.startsWith("mailto:")) {
      const email = data.replace("mailto:", "").trim();
      dData = {
        email: email,
      };
      return { type: "email", email };
    } else if (data.startsWith("tel:")) {
      const phone = data.replace("tel:", "").trim();
      dData = {
        phone: phone,
      };
      return { type: "phone", phone };
    } else if (data.startsWith("SMSTO:")) {
      const [phone, message] = data.replace("SMSTO:", "").split(":");
      dData = {
        phone: phone,
        message: message,
      };
      return { type: "sms", phone, message };
    }
    dData = {
      data,
    };
    return { type: "raw", content: data };
  };

  const qrData = parseQRCodeData(rawData);
  useEffect(() => {
    setData(dData);
  }, [rawData]);
  const addEventToCalendar = async (title, startDate, endDate) => {
    try {
      // const start = parseDate(startDate);
      // const end = parseDate(endDate);
      const eventConfig = {
        title,
        startDate: startDate,
        endDate: endDate,
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
          message: content || title || email || phone || message,
        });
        break;
      case "connectWifi":
        if (type === "wifi") {
          try {
            await WifiManager.connectToProtectedSSID(
              ssid,
              password,
              false,
              false
            );
            Alert.alert("Connected", `Successfully connected to ${ssid}`);
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
      default:
        break;
    }
  };

  const renderQRContent = () => {
    if (data) {
      return (
        <View style={styles.dataItem}>
          {Object.entries(data).map(([key, value]) => (
            <Text key={key} style={styles.text}>{value}</Text>
          ))}
        </View>
      );
    }
  };

  console.log(data);
  return (
    <View style={styles.container}>
      <View style={styles.dataContainer}>
        {qrData.type === "url" && (
          <Icon name="link" size={40} color="#007BFF" />
        )}
        {qrData.type === "wifi" && (
          <Icon name="wifi" size={40} color="#007BFF" />
        )}
        {qrData.type === "calendar" && (
          <Icon name="event" size={40} color="#007BFF" />
        )}
        {qrData.type === "email" && (
          <Icon name="email" size={40} color="#007BFF" />
        )}
        {qrData.type === "phone" && (
          <Icon name="phone" size={40} color="#007BFF" />
        )}
        {qrData.type === "sms" && <Icon name="sms" size={40} color="#007BFF" />}
        {/* <Text style={styles.text}>{JSON.stringify(data, null, 2)}</Text> */}
        {renderQRContent()}
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleAction("copy")}
        >
          <Text style={styles.buttonText}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleAction("share")}
        >
          <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>
        {qrData.type === "url" && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleAction("open")}
          >
            <Text style={styles.buttonText}>Open</Text>
          </TouchableOpacity>
        )}
        {qrData.type === "wifi" && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleAction("connectWifi")}
          >
            <Text style={styles.buttonText}>Connect</Text>
          </TouchableOpacity>
        )}
        {qrData.type === "calendar" && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleAction("addCalendar")}
          >
            <Text style={styles.buttonText}>Add Event</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  dataContainer: { alignItems: "center", marginBottom: 20 },
  text: { fontSize: 16, marginVertical: 10, textAlign: "center" },
  dataItem: { marginVertical: 5 },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    margin: 5,
  },
  buttonText: { color: "#fff", fontSize: 16 },
});
