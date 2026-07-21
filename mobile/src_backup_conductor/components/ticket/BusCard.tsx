import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";

type Props = {
  booking: any;
};

export default function BusCard({ booking }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>
        🚌 Bus Details
      </Text>

      <Text style={styles.item}>
        Bus Name : {booking.bus_name || "Rular Express"}
      </Text>

      <Text style={styles.item}>
        Bus Number : {booking.bus_number || "RB-001"}
      </Text>

      <Text style={styles.item}>
        Seat : {booking.seat_number}
      </Text>

      <Text style={styles.item}>
        Bus Type : AC Sleeper
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

