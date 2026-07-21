import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function TravelInstructions() {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>
        📋 Travel Instructions
      </Text>

      <Text style={styles.item}>
        ✅ Reach boarding point 30 minutes before departure.
      </Text>

      <Text style={styles.item}>
        🪪 Carry a valid Photo ID during travel.
      </Text>

      <Text style={styles.item}>
        📱 Show this QR Ticket while boarding.
      </Text>

      <Text style={styles.item}>
        🚭 Smoking & alcohol are prohibited inside the bus.
      </Text>

      <Text style={styles.item}>
        🎒 Keep your luggage safely with you.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#FFF8E7",
    borderWidth: 1,
    borderColor: "#FACC15",
    marginBottom: 20,
  },

  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#B45309",
    marginBottom: 15,
  },

  item: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 12,
  },
});
