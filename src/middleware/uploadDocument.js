const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/documents");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1E9);

    cb(
      null,
      uniqueName + path.extname(file.originalname)
    );
  }
});

const fileFilter = (req, file, cb) => {

  const allowed = [
    "image/jpeg",
    "image/png",
    "application/pdf"
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG and PDF files are allowed."));
  }

};

module.exports = multer({

  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter

});

