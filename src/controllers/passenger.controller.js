const pool = require("../config/db");

const RELATIONSHIPS = [
  "SELF",
  "SPOUSE",
  "SON",
  "DAUGHTER",
  "FATHER",
  "MOTHER",
  "BROTHER",
  "SISTER",
  "RELATIVE",
  "FRIEND",
  "OTHER",
];

const GENDERS = [
  "MALE",
  "FEMALE",
  "OTHER",
];

const normalizePhone = (value) => {
  const phone = String(value || "")
    .replace(/\D/g, "")
    .trim();

  return phone || null;
};

const normalizeEmail = (value) => {
  const email = String(value || "")
    .trim()
    .toLowerCase();

  return email || null;
};

const normalizeDate = (value) => {
  const date = String(value || "").trim();

  return /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? date
    : null;
};

const getPassengerCategory = (ageValue) => {
  const age = Number(ageValue);

  if (!Number.isInteger(age)) {
    return null;
  }

  if (age <= 4) {
    return "INFANT";
  }

  if (age <= 11) {
    return "CHILD";
  }

  if (age <= 59) {
    return "ADULT";
  }

  return "SENIOR";
};

const validatePassenger = (payload = {}) => {
  const fullName = String(
    payload.full_name || ""
  )
    .replace(/\s+/g, " ")
    .trim();

  const gender = String(
    payload.gender || ""
  )
    .trim()
    .toUpperCase();

  const age = Number(payload.age);

  const phone = normalizePhone(
    payload.phone
  );

  const email = normalizeEmail(
    payload.email
  );

  const savedTravellerId = payload.saved_traveller_id
    ? Number(payload.saved_traveller_id)
    : null;

  const dateOfBirth = normalizeDate(
    payload.date_of_birth
  );

  const relationship = String(
    payload.relationship || "OTHER"
  )
    .trim()
    .toUpperCase();

  if (fullName.length < 2) {
    return {
      valid: false,
      message:
        "Passenger full name is required.",
    };
  }

  if (!GENDERS.includes(gender)) {
    return {
      valid: false,
      message:
        "Valid passenger gender is required.",
    };
  }

  if (
    !Number.isInteger(age) ||
    age < 0 ||
    age > 120
  ) {
    return {
      valid: false,
      message:
        "Passenger age must be between 0 and 120.",
    };
  }

  if (
    phone &&
    !/^[0-9]{10,15}$/.test(phone)
  ) {
    return {
      valid: false,
      message:
        "Passenger phone must contain 10 to 15 digits.",
    };
  }

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {
    return {
      valid: false,
      message:
        "Passenger email format is invalid.",
    };
  }

  if (
    savedTravellerId !== null &&
    (
      !Number.isInteger(savedTravellerId) ||
      savedTravellerId <= 0
    )
  ) {
    return {
      valid: false,
      message:
        "Saved traveller ID is invalid.",
    };
  }

  if (
    !RELATIONSHIPS.includes(
      relationship
    )
  ) {
    return {
      valid: false,
      message:
        "Passenger relationship is invalid.",
    };
  }

  return {
    valid: true,
    fullName,
    phone,
    email,
    gender,
    age,
    savedTravellerId,
    dateOfBirth,
    relationship,
    passengerCategory:
      getPassengerCategory(age),
  };
};

const addPassenger = async (req, res) => {
  try {
    const validation =
      validatePassenger(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    if (validation.savedTravellerId) {
      const savedTraveller =
        await pool.query(
          `
            SELECT id
            FROM saved_travellers
            WHERE id = $1
              AND is_active = TRUE
          `,
          [
            validation.savedTravellerId,
          ]
        );

      if (!savedTraveller.rows.length) {
        return res.status(404).json({
          success: false,
          message:
            "Saved traveller not found.",
        });
      }
    }

    const result = await pool.query(
      `
        INSERT INTO passengers (
          full_name,
          phone,
          email,
          gender,
          age,
          passenger_category,
          saved_traveller_id,
          date_of_birth,
          relationship
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9
        )
        RETURNING *
      `,
      [
        validation.fullName,
        validation.phone,
        validation.email,
        validation.gender,
        validation.age,
        validation.passengerCategory,
        validation.savedTravellerId,
        validation.dateOfBirth,
        validation.relationship,
      ]
    );

    return res.status(201).json({
      success: true,
      message:
        "Passenger snapshot created successfully.",
      passenger: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Add passenger failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to add passenger.",
    });
  }
};

const getAllPassengers = async (
  req,
  res
) => {
  try {
    const result = await pool.query(
      `
        SELECT *
        FROM passengers
        ORDER BY id DESC
      `
    );

    return res.json({
      success: true,
      passengers: result.rows,
    });
  } catch (error) {
    console.error(
      "Get passengers failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load passengers.",
    });
  }
};

const updatePassenger = async (
  req,
  res
) => {
  try {
    const passengerId = Number(
      req.params.id
    );

    if (
      !Number.isInteger(passengerId) ||
      passengerId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid passenger ID is required.",
      });
    }

    const validation =
      validatePassenger(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const result = await pool.query(
      `
        UPDATE passengers
        SET
          full_name = $1,
          phone = $2,
          email = $3,
          gender = $4,
          age = $5,
          passenger_category = $6,
          saved_traveller_id = $7,
          date_of_birth = $8,
          relationship = $9
        WHERE id = $10
        RETURNING *
      `,
      [
        validation.fullName,
        validation.phone,
        validation.email,
        validation.gender,
        validation.age,
        validation.passengerCategory,
        validation.savedTravellerId,
        validation.dateOfBirth,
        validation.relationship,
        passengerId,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message:
          "Passenger not found.",
      });
    }

    return res.json({
      success: true,
      message:
        "Passenger updated successfully.",
      passenger: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update passenger failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update passenger.",
    });
  }
};

const deletePassenger = async (
  req,
  res
) => {
  try {
    const passengerId = Number(
      req.params.id
    );

    if (
      !Number.isInteger(passengerId) ||
      passengerId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid passenger ID is required.",
      });
    }

    const result = await pool.query(
      `
        DELETE FROM passengers
        WHERE id = $1
        RETURNING *
      `,
      [passengerId]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message:
          "Passenger not found.",
      });
    }

    return res.json({
      success: true,
      message:
        "Passenger deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete passenger failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete passenger.",
    });
  }
};

module.exports = {
  addPassenger,
  getAllPassengers,
  updatePassenger,
  deletePassenger,
};
