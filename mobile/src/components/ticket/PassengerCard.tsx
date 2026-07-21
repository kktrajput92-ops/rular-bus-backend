import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";

type Props = {
  booking: any;
};

export default function PassengerCard({
  booking,
}: Props) {

  const formatDate = (date: string) => {
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
        👤 Passenger Information
      </Text>

      <View style={styles.topRow}>

        <View>

          <Text style={styles.name}>
            {booking.full_name || "Passenger"}
          </Text>

          <Text style={styles.bookingId}>
            Booking ID : #{booking.id}
          </Text>

        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            ✔ VERIFIED
          </Text>
        </View>

      </View>

      <View style={styles.line} />

      <Text style={styles.item}>
        Seat Number : {booking.seat_number}
      </Text>

      <Text style={styles.item}>
        Status : Confirmed ✅
      </Text>

      <View style={styles.line} />

      <Text style={styles.item}>
  Booking Date : {formatDate(booking.created_at)}
</Text>

<Text style={styles.item}>
  Journey Date : {formatDate(booking.departure_time)}
</Text>

</View>
);
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
  },
  heading: {
  fontSize: 22,
  fontWeight: "700",
  color: "#0B3D91",
  marginBottom: 18,
},
   name: {
  fontSize: 24,
  fontWeight: "700",
  color: "#0B3D91",
},
  verify: {
    color: "#16A34A",
    fontWeight: "700",
    marginVertical: 10,
  },
  line: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginVertical: 15,
  },
  item: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  bookingId: {
    marginTop: 6,
    color: "#6B7280",
  },

  badge: {
  backgroundColor: "#16A34A",
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 30,
  elevation: 4,
},

badgeText: {
  color: "#FFFFFF",
  fontWeight: "700",
  fontSize: 13,
},
});
