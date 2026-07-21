import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";

type Props = {
  payment: any;
};

export default function PaymentCard({
  payment,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>
        💳 Payment Details
      </Text>

      <Text style={styles.item}>
        Payment ID : {payment?.id || "N/A"}
      </Text>

      <Text style={styles.item}>
        Method : {payment?.payment_method || "UPI"}
      </Text>

      <Text style={styles.item}>
        Amount : ₹{payment?.amount || 450}
      </Text>

     <Text style={styles.item}>
  Status : <Text style={styles.status}>Payment Successful ✅</Text>
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
    fontSize: 20,
    fontWeight: "700",
    color: "#0B3D91",
    marginBottom: 15,
  },

  item: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 10,
  },

  status: {
    color: "#16A34A",
    fontWeight: "700",
    fontSize: 16,
    marginTop: 5,
  },
});

