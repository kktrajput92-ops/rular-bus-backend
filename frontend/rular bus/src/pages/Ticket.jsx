import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import TicketHeader from "../components/ticket/TicketHeader";
import PassengerCard from "../components/ticket/PassengerCard";
import JourneyCard from "../components/ticket/JourneyCard";
import PaymentCard from "../components/ticket/PaymentCard";
import QRSection from "../components/ticket/QRSection";
import TicketActions from "../components/ticket/TicketActions";
import BusCard from "../components/ticket/BusCard";
import BoardingCard from "../components/ticket/BoardingCard";
import BrandCard from "../components/ticket/BrandCard";
import TravelInstructions from "../components/ticket/TravelInstructions";
function Ticket() {

  const navigate = useNavigate();
  const location = useLocation();

  const { booking, payment } = location.state || {};

  const downloadPDF = async () => {
  const ticket = document.getElementById("ticket-card");
  if (!ticket) return;

  const canvas = await html2canvas(ticket, {
  scale: 1,
  useCORS: true,
  logging: false,
  backgroundColor: "#ffffff",
});

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  const pdfWidth = 210;
  const pdfHeight = 297;

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
let position = 0;

while (heightLeft > 0) {
  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);

  heightLeft -= pdfHeight;

  if (heightLeft > 0) {
    position -= pdfHeight;
    pdf.addPage();
  }
}

pdf.save(`RularBus-Ticket-${booking.id}.pdf`);
};
  const shareTicket = async () => {

    const message =
`🚌 Rular Bus Ticket

Booking ID : ${booking.id}

Seat : ${booking.seat_number}

Route : ${booking.source} ➜ ${booking.destination}

Status : Confirmed ✅`;

    if (navigator.share) {

      try {

        await navigator.share({

          title: "Rular Bus Ticket",

          text: message,

        });

      } catch (err) {

        console.log(err);

      }

    } else {

      await navigator.clipboard.writeText(message);

      alert("Ticket copied to clipboard.");

    }

  };

  if (!booking || !payment) {

    return (

      <div
        style={{
  minHeight: "100vh",
  background:
    "linear-gradient(180deg,#EAF2FF 0%,#F5F7FB 100%)",
  padding: "25px",
}}
      >
        Ticket Not Found
      </div>

    );

  }

  return (

    <div
      style={{
        minHeight: "100vh",
        background: "#eef3f8",
        padding: "25px",
      }}
    >
      <div
        id="ticket-card"
       style={{
  maxWidth: "720px",
  margin: "0 auto",
  background: "rgba(255,255,255,.95)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(11,61,145,.10)",
  borderRadius: "24px",
  padding: "32px",
  boxShadow: "0 20px 45px rgba(11,61,145,.12)",
position: "relative",
overflow: "hidden",
}}
      >
<div
  style={{
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-30deg)",
    fontSize: "72px",
    fontWeight: "900",
    color: "rgba(11,61,145,.05)",
    pointerEvents: "none",
    userSelect: "none",
    whiteSpace: "nowrap",
  }}
>
  RULAR BUS
</div>
        <TicketHeader />
<div
  style={{
    margin: "20px 0",
    padding: "18px",
    borderRadius: "16px",
    background: "linear-gradient(90deg,#0B3D91,#1565C0)",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 10px 25px rgba(11,61,145,.20)",
  }}
>
  <div>
    <div
      style={{
        fontSize: "12px",
        opacity: 0.85,
        textTransform: "uppercase",
      }}
    >
      Premium Digital Ticket
    </div>

    <h2
      style={{
        margin: "6px 0",
        letterSpacing: "1px",
      }}
    >
      RB-{booking.id}
    </h2>

    <div style={{ fontSize: "13px", opacity: 0.9 }}>
      Booking #{booking.id}
    </div>
  </div>

  <div
    style={{
      textAlign: "right",
    }}
  >
    <div
      style={{
        background: "#16A34A",
        padding: "6px 12px",
        borderRadius: "30px",
        fontWeight: "bold",
        display: "inline-block",
      }}
    >
      VERIFIED ✓
    </div>

    <div
      style={{
        marginTop: "12px",
        fontSize: "15px",
      }}
    >
      Seat {booking.seat_number}
    </div>
  </div>
</div>

       <div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "15px",
  }}
>
  <div
    style={{
      background: "#E8FFF1",
      color: "#15803D",
      border: "1px solid #22C55E",
      padding: "8px 14px",
      borderRadius: "30px",
      fontWeight: "bold",
      fontSize: "13px",
    }}
  >
    🛡 Official Digital Ticket
  </div>
</div>
        <PassengerCard booking={booking} />

        <JourneyCard booking={booking} />
        <BusCard booking={booking} />
        <BoardingCard booking={booking} />
          <QRSection
          booking={booking}
          payment={payment}
        />

        <PaymentCard payment={payment} />

<TravelInstructions />

<BrandCard />
        <TicketActions
          onDownload={downloadPDF}
          onShare={shareTicket}
          onHome={() => navigate("/")}
        />
      </div>
    </div>
  );

}

export default Ticket;
