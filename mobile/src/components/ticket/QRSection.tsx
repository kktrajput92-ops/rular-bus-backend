import React from "react";
import { View, Text, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";

type Props = {
  booking: any;
};

export default function QRSection({ booking }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>
        🔳 Smart QR Ticket
      </Text>

      <View style={styles.qrBox}>
        <QRCode
          value={JSON.stringify({
            ticket_number: booking?.ticket_number,
            booking_id: booking?.id,
          })}
          size={170}
        />
      </View>

      <Text style={styles.label}>
        Verification Code
      </Text>

      <Text style={styles.code}>
        {booking?.ticket_number}
      </Text>

      <Text style={styles.note}>
        Scan this QR Code while boarding the bus.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    marginBottom: 20,
  },

  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0B3D91",
    marginBottom: 15,
  },

  qrBox: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    borderRadius: 12,
  },

  label: {
    marginTop: 15,
    fontWeight: "700",
    color: "#0B3D91",
  },

  code: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 10,
  },

  note: {
    marginTop: 10,
    color: "#6B7280",
    textAlign: "center",
  },
});
