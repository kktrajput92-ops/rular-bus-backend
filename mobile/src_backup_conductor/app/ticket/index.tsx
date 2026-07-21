
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import TicketHeader from "@/components/ticket/TicketHeader";
import PassengerCard from "@/components/ticket/PassengerCard";
import JourneyCard from "../../components/ticket/JourneyCard";
import BusCard from "../../components/ticket/BusCard";
import PaymentCard from "../../components/ticket/PaymentCard";
import QRSection from "../../components/ticket/QRSection";
import BoardingCard from "../../components/ticket/BoardingCard";
import BrandCard from "../../components/ticket/BrandCard";
import TravelInstructions from "../../components/ticket/TravelInstructions";
import TicketActions from "../../components/ticket/TicketActions";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { getTicketPdfUrl } from "@/services/ticket.service";

export default function TicketScreen() {
  const { booking } = useLocalSearchParams<{
    booking: string;
  }>();
const data = booking ? JSON.parse(booking) : null;
const handleShare = async () => {
  await Share.share({
    message: `🚌 Rular Bus Ticket

Passenger: ${data?.full_name}
Booking ID: ${data?.id}
Seat: ${data?.seat_number}
Route: ${data?.source} → ${data?.destination}`,
  });
};

const handleDownload = async () => {
  if (!data?.ticket_number) {
    Alert.alert("Error", "Ticket number not found");
    return;
  }

  const url = getTicketPdfUrl(data.ticket_number);

  console.log("PDF URL =", url);

  // WEB
  if (typeof window !== "undefined") {
    window.open(url, "_blank");
    return;
  }

  // ANDROID / IOS
  try {
    const fileUri =
      FileSystem.documentDirectory +
      `${data.ticket_number}.pdf`;

    const result = await FileSystem.downloadAsync(
      url,
      fileUri
    );

    await Sharing.shareAsync(result.uri);

  } catch (err) {
    console.log(err);
    Alert.alert("Error", "Unable to download PDF");
  }
};
   

const handleHome = () => {
  router.replace("/");
};
  return (
    <ScrollView contentContainerStyle={styles.container}>
   <View style={styles.card}>
<TicketHeader />
<View style={styles.summaryCard}>
  <View>
    <Text style={styles.ticketNo}>
      {data?.ticket_number || `RB${data?.id}`}
    </Text>

    <Text style={styles.smallText}>
      Booking ID : {data?.id}
    </Text>

    <Text style={styles.smallText}>
      Bus : {data?.bus_name}
    </Text>

    <Text style={styles.smallText}>
      Bus No : {data?.bus_number}
    </Text>
  </View>

  <View style={{ alignItems: "flex-end" }}>
    <View style={styles.paidBadge}>
      <Text style={{ color: "#fff", fontWeight: "700" }}>
        PAID ✓
      </Text>
    </View>

    <Text
      style={{
        color: "#fff",
        marginTop: 12,
      }}
    >
      Seat {data?.seat_number}
    </Text>
  </View>
</View>
<View
  style={{
    alignItems: "flex-end",
    marginBottom: 14,
  }}
>
  <View
    style={styles.officialBadge}
  >
    <Text
      style={styles.officialBadgeText}
    >
      🛡 Official Digital Ticket
    </Text>
  </View>
</View>
<PassengerCard booking={data} />

<JourneyCard booking={data} />

<BusCard booking={data} />

<BoardingCard booking={data} />

<QRSection booking={data} />

<PaymentCard payment={data} />

<TravelInstructions />

<BrandCard />

<TicketActions
  onDownload={handleDownload}
  onShare={handleShare}
  onHome={handleHome}
/>
</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
  flexGrow: 1,
  backgroundColor: "#F3F6FB",
  padding: 20,
  justifyContent: "center",
},
  title: {
  fontSize: 26,
  fontWeight: "700",
  textAlign: "center",
  marginBottom: 10,
  color: "#1E3A8A",
},
     card: {
  backgroundColor: "#FFFFFF",
  borderRadius: 18,
  padding: 20,
  marginTop: 30,
  width: "100%",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 3,
  },
  shadowOpacity: 0.2,
  shadowRadius: 6,
  elevation: 6,
},

  success: {
  textAlign: "center",
  color: "#16A34A",
  fontSize: 18,
  fontWeight: "700",
  marginBottom: 25,
},

  item: {
  fontSize: 17,
  color: "#374151",
  marginBottom: 12,
},

logo: {
  width: 90,
  height: 90,
  alignSelf: "center",
  marginBottom: 15,
  resizeMode: "contain",
},
infoBox: {
  marginTop: 10,
  borderTopWidth: 1,
  borderTopColor: "#E5E7EB",
  paddingTop: 15,
},

label: {
  fontSize: 13,
  color: "#6B7280",
  marginTop: 10,
},

value: {
  fontSize: 18,
  fontWeight: "600",
  color: "#111827",
},

seat: {
  fontSize: 28,
  fontWeight: "700",
  color: "#2563EB",
  backgroundColor: "#DBEAFE",
  textAlign: "center",
  paddingVertical: 10,
  borderRadius: 10,
  marginVertical: 10,
},  
summaryCard: {
  marginTop: 18,
  marginBottom: 18,
  backgroundColor: "#0B3D91",
  borderRadius: 18,
  padding: 18,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},


ticketNo: {
  color: "#FFF",
  fontSize: 24,
  fontWeight: "700",
},

smallText: {
  color: "#E5E7EB",
  fontSize: 13,
  marginTop: 4,
},

paidBadge: {
  backgroundColor: "#16A34A",
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 30,
},
officialBadge: {
  backgroundColor: "#E8FFF1",
  borderWidth: 1,
  borderColor: "#22C55E",
  borderRadius: 20,
  paddingHorizontal: 12,
  paddingVertical: 6,
},

officialBadgeText: {
  color: "#15803D",
  fontSize: 12,
  fontWeight: "700",
},
});

