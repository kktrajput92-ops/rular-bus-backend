const PDFDocument = require("pdfkit");

const generateTicket = (res, ticket) => {
  const doc = new PDFDocument({
    margin: 40,
    size: "A4",
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=${ticket.ticket_number}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(22).text("RULAR BUS", {
    align: "center",
  });

  doc.moveDown();

  doc.fontSize(18).text("BUS TICKET", {
    align: "center",
  });

  doc.moveDown();

  doc.fontSize(14).text(`Ticket No : ${ticket.ticket_number}`);
  doc.text(`Passenger : ${ticket.full_name}`);
  doc.text(`Phone : ${ticket.phone}`);
  doc.text(`From : ${ticket.source}`);
  doc.text(`To : ${ticket.destination}`);
  doc.text(`Seat : ${ticket.seat_number}`);
  doc.text(`Booking : ${ticket.booking_status}`);
  doc.text(`Departure : ${ticket.departure_time}`);

  doc.moveDown();

  if (ticket.qr_code) {
    const base64 = ticket.qr_code.replace(
      /^data:image\/png;base64,/,
      ""
    );

    const buffer = Buffer.from(base64, "base64");

    doc.image(buffer, {
      width: 140,
      align: "center",
    });
  }

  doc.moveDown();

  doc.fontSize(12).text(
    "Thank you for choosing Rular Bus.",
    {
      align: "center",
    }
  );

  doc.end();
};

module.exports = generateTicket;
