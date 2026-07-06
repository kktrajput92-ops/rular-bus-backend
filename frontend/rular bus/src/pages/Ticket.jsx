
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
function Ticket() {

  const navigate = useNavigate();
  const location = useLocation();

  const { booking, payment } = location.state || {};

  const downloadPDF = async () => {

    const ticket =
      document.getElementById("ticket-card");

    if (!ticket) return;

    const canvas = await html2canvas(ticket, {
      scale: 2,
    });

    const imgData =
      canvas.toDataURL("image/png");

    const pdf =
      new jsPDF("p", "mm", "a4");

    const pdfWidth = 190;

    const pdfHeight =
      (canvas.height * pdfWidth) /
      canvas.width;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);

    pdf.text(
      "Rular Bus Smart Ticket",
      10,
      10
    );

    pdf.addImage(
      imgData,
      "PNG",
      10,
      20,
      pdfWidth,
      pdfHeight
    );

    pdf.save(
      `RularBus-Ticket-${booking.id}.pdf`
    );

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
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "22px",
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
          maxWidth: "700px",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "20px",
          padding: "30px",
          boxShadow: "0 12px 35px rgba(0,0,0,.15)",
        }}
      >
        <TicketHeader />

        <PassengerCard booking={booking} />

        <JourneyCard booking={booking} />
        <BusCard booking={booking} />
        <BoardingCard booking={booking} />
          <QRSection
          booking={booking}
          payment={payment}
        />

        <PaymentCard payment={payment} />

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
