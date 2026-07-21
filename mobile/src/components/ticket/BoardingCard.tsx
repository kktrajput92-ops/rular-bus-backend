import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  booking: any;
};

export default function BoardingCard({ booking }: Props) {
  const formatDateTime = (date: string) => {
    if (!date) return "--";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>
        📍 Boarding Details
      </Text>

      <Text style={styles.item}>
        Boarding Point : {booking?.source || "Main Bus Stand"}
      </Text>

      <Text style={styles.item}>
        Reporting Time : 30 Minutes Before Departure
      </Text>

      <Text style={styles.item}>
        Departure : {formatDateTime(booking?.departure_time)}
      </Text>

      <Text style={styles.item}>
        Dropping Point : {booking?.destination || "Destination"}
      </Text>

      <Text style={styles.item}>
        Estimated Arrival : {formatDateTime(booking?.arrival_time)}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
card: {
  marginTop: 20,
  backgroundColor: "#FFFFFF",
  borderRadius: 18,
  padding: 20,

  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 5,

  marginBottom: 20,
},

heading: {
  fontSize: 20,
  fontWeight: "700",
  color: "#0B3D91",
  marginBottom: 16,
},

item: {
  fontSize: 16,
  color: "#374151",
  marginBottom: 12,
  lineHeight: 22,
},
});
