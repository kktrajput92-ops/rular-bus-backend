import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
} from "react-native";
import logo from "../../assets/images/logo.png";

export default function TicketHeader() {
  return (
    <View style={styles.container}>
<View style={styles.circle} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          PREMIUM DIGITAL TICKET
        </Text>
      </View>

<Image
  source={logo}
  style={styles.logo}
  resizeMode="contain"
/>
      <Text style={styles.title}>
        🚌 Rular Bus
      </Text>

      <Text style={styles.subtitle}>
        Travel Beyond Expectations
      </Text>

      <Text style={styles.description}>
        Your journey has been successfully confirmed.
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({

 container: {
  backgroundColor: "#0B4EA2",
  borderRadius: 22,
  paddingVertical: 28,
  paddingHorizontal: 24,
  alignItems: "center",
  marginBottom: 22,
  shadowColor: "#000",
  shadowOpacity: 0.18,
  shadowRadius: 12,
  elevation: 8,
},

  badge: {
    backgroundColor: "#F4B400",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 30,
    marginBottom: 18,
  },

  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },

title: {
  fontSize: 36,
  fontWeight: "800",
  color: "#FFFFFF",
  marginTop: 4,
},

  subtitle: {
  fontSize: 18,
  color: "#DCEBFF",
  marginTop: 8,
},

  description: {
  marginTop: 16,
  color: "#EAF2FF",
  fontSize: 14,
  textAlign: "center",
},

logo: {
  width: 72,
  height: 72,
  marginBottom: 12,
},

circle: {
  position: "absolute",
  top: -35,
  right: -35,
  width: 90,
  height: 90,
  borderRadius: 45,
  backgroundColor: "rgba(255,255,255,0.08)",
},
});
