import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";

import { createPassenger } from "@/services/passenger.service";
import { createBooking } from "@/services/booking.service";
import { getSeatStatus } from "@/services/seat.service";
const TOTAL_SEATS = 24;
const FARE = 599;
export default function BookingScreen() {
const router = useRouter();
const { schedule_id } = useLocalSearchParams<{
  schedule_id: string;
}>();
 

  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
const [bookedSeats, setBookedSeats] = useState<number[]>([]);
useEffect(() => {
  async function loadSeats() {
    try {
      const result = await getSeatStatus(Number(schedule_id));
      setBookedSeats(result.booked_seats || []);
    } catch (err) {
      console.log(err);
    }
  }

  if (schedule_id) {
    loadSeats();
  }
}, [schedule_id]);
const seats = useMemo(
  () =>
    Array.from({ length: TOTAL_SEATS }, (_, i) => ({
      id: i + 1,
      booked: bookedSeats.includes(i + 1),
    })),
  [bookedSeats]
); 
 const toggleSeat = (seat: {
    id: number;
    booked: boolean;
  }) => {
    if (seat.booked) return;

    if (selectedSeats.includes(seat.id)) {
      setSelectedSeats(
        selectedSeats.filter((s) => s !== seat.id)
      );
    } else {
      setSelectedSeats([
        ...selectedSeats,
        seat.id,
      ]);
    }
  };

  const totalFare =
    selectedSeats.length * FARE;
console.log("Schedule ID =", schedule_id);
  const handleContinue = async () => {
    if (!name.trim()) {
      alert("Please enter passenger name");
      return;
    }

    if (!mobile.trim() || mobile.trim().length !== 10) {
      alert("Please enter a valid 10 digit mobile number");
      return;
    }

    if (selectedSeats.length === 0) {
      alert("Please select at least one seat");
      return;
    }

    try {
      const passengerResponse = await createPassenger({
        full_name: name.trim(),
        phone: mobile.trim(),
        email: "",
        gender: "",
      });

      const passengerId =
        passengerResponse.passenger.id;

      const bookingResponse = await createBooking({
        passenger_id: passengerId,
        schedule_id: Number(schedule_id),
        seat_number: selectedSeats[0],
      });

      console.log("BOOKING =", bookingResponse);
console.log("BOOKING DATA =", bookingResponse.booking);
console.log("TICKET =", bookingResponse.booking?.ticket_number);
setSelectedSeats([]);
setName("");
setMobile("");

const result = await getSeatStatus(Number(schedule_id));
setBookedSeats(result.booked_seats || []);
router.push({
  pathname: "/ticket",
  params: {
    booking: JSON.stringify(bookingResponse.booking),
  },
});      
alert("Booking Created Successfully");
    } catch (err: any) {
      console.log(err);
      alert(err.message);
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Select Your Seat</Text>

      <View style={styles.seatGrid}>
        {seats.map((seat) => {
          const selected = selectedSeats.includes(seat.id);

          return (
            <TouchableOpacity
              key={seat.id}
              disabled={seat.booked}
              onPress={() => toggleSeat(seat)}
              style={[
                styles.seat,
                seat.booked && styles.bookedSeat,
                selected && styles.selectedSeat,
              ]}
            >
              <Text style={styles.seatText}>
                {seat.id}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.heading}>
        Passenger Details
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Passenger Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Mobile Number"
        keyboardType="phone-pad"
        value={mobile}
        onChangeText={setMobile}
      />

      <Text style={styles.summary}>
        Selected Seats: {selectedSeats.join(", ") || "-"}
      </Text>

      <Text style={styles.summary}>
        Total Fare: ₹{totalFare}
      </Text>

      <TouchableOpacity
  style={styles.button}
  onPress={handleContinue}
>
        <Text style={styles.buttonText}>
          Continue
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F5F5F5",
    flexGrow: 1,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },

  seatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  seat: {
    width: "22%",
    aspectRatio: 1,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 12,
  },

  bookedSeat: {
    backgroundColor: "#EF4444",
  },

  selectedSeat: {
    backgroundColor: "#22C55E",
  },

  seatText: {
    color: "#111827",
    fontWeight: "700",
  },

  heading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 10,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 16,
  },

  summary: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },

  button: {
    marginTop: 20,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
