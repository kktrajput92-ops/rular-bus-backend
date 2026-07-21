import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function BrandCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        🚌 Rular Bus
      </Text>

      <Text style={styles.subtitle}>
        Travel Beyond Expectations
      </Text>

      <View style={styles.line} />

      <Text style={styles.text}>
        🛡 Official Digital Ticket
      </Text>

      <Text style={styles.text}>
        📞 24×7 Customer Support
      </Text>

      <Text style={styles.text}>
        📧 support@rularbus.in
      </Text>

      <Text style={styles.text}>
        🌐 www.rularbus.in
      </Text>

      <Text style={styles.text}>
        🚍 Safe • Secure • Comfortable Journey
      </Text>

      <View style={styles.line} />

      <Text style={styles.powered}>
        Powered by
      </Text>

      <Text style={styles.engine}>
        Rular Bus Smart Journey Engine™
      </Text>

      <Text style={styles.version}>
        Version 2.0 • Premium Digital Ticket
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
  marginTop: 30,
  padding: 28,
  borderRadius: 20,
  backgroundColor: "#0B3D91",
  alignItems: "center",
  marginBottom: 20,

shadowColor: "#0B3D91",
shadowOffset: {
  width: 0,
  height: 8,
},
shadowOpacity: 0.12,
shadowRadius: 14,
elevation: 8,  

  shadowOpacity: 0.25,
  shadowRadius: 16,
  elevation: 8,
},

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  subtitle: {
    marginTop: 10,
    fontSize: 17,
    color: "#FFFFFF",
  },

  line: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,.25)",
    marginVertical: 20,
  },

  text: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 8,
  },

  powered: {
    fontSize: 13,
    color: "#FFFFFF",
  },

  engine: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },

  version: {
    marginTop: 8,
    fontSize: 12,
    color: "#FFFFFF",
  },
});

