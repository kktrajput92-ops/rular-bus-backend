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

const normalizeName = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

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
  const date = String(value || "")
    .trim();

  return date || null;
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) {
    return null;
  }

  const birthDate =
    new Date(`${dateOfBirth}T00:00:00`);

  if (
    Number.isNaN(
      birthDate.getTime()
    )
  ) {
    return null;
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDifference =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() <
        birthDate.getDate()
    )
  ) {
    age -= 1;
  }

  return age;
};

const getPassengerCategory = (age) => {
  if (
    !Number.isInteger(age) ||
    age < 0
  ) {
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

const validatePayload = (body) => {
  const fullName =
    normalizeName(body.full_name);

  const relationship = String(
    body.relationship || "OTHER"
  )
    .trim()
    .toUpperCase();

  const gender = String(
    body.gender || ""
  )
    .trim()
    .toUpperCase();

  const dateOfBirth =
    normalizeDate(body.date_of_birth);

  const phone =
    normalizePhone(body.phone);

  const email =
    normalizeEmail(body.email);

  if (fullName.length < 2) {
    return {
      valid: false,
      message:
        "Traveller full name is required.",
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
        "Valid relationship is required.",
    };
  }

  if (!GENDERS.includes(gender)) {
    return {
      valid: false,
      message:
        "Valid traveller gender is required.",
    };
  }

  if (!dateOfBirth) {
    return {
      valid: false,
      message:
        "Traveller date of birth is required.",
    };
  }

  const age =
    calculateAge(dateOfBirth);

  if (
    !Number.isInteger(age) ||
    age < 0 ||
    age > 120
  ) {
    return {
      valid: false,
      message:
        "Traveller date of birth is invalid.",
    };
  }

  if (
    phone &&
    !/^[0-9]{10,15}$/.test(phone)
  ) {
    return {
      valid: false,
      message:
        "Traveller mobile number is invalid.",
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
        "Traveller email address is invalid.",
    };
  }

  return {
    valid: true,
    fullName,
    relationship,
    gender,
    dateOfBirth,
    phone,
    email,
    age,
    passengerCategory:
      getPassengerCategory(age),
  };
};

const travellerSelect = `
  SELECT
    traveller.id,
    traveller.customer_profile_id,
    traveller.full_name,
    traveller.relationship,
    traveller.gender,
    traveller.date_of_birth,
    traveller.phone,
    traveller.email,
    traveller.is_active,
    traveller.created_at,
    traveller.updated_at,

    DATE_PART(
      'year',
      AGE(
        CURRENT_DATE,
        traveller.date_of_birth
      )
    )::INTEGER AS age,

    CASE
      WHEN DATE_PART(
        'year',
        AGE(
          CURRENT_DATE,
          traveller.date_of_birth
        )
      ) BETWEEN 0 AND 4
        THEN 'INFANT'

      WHEN DATE_PART(
        'year',
        AGE(
          CURRENT_DATE,
          traveller.date_of_birth
        )
      ) BETWEEN 5 AND 11
        THEN 'CHILD'

      WHEN DATE_PART(
        'year',
        AGE(
          CURRENT_DATE,
          traveller.date_of_birth
        )
      ) BETWEEN 12 AND 59
        THEN 'ADULT'

      ELSE 'SENIOR'
    END AS passenger_category

  FROM saved_travellers traveller
`;

const getCustomerProfileId = (req) => {
  const value = Number(
    req.customer?.id
  );

  return Number.isInteger(value) &&
    value > 0
    ? value
    : null;
};

const getSavedTravellers = async (
  req,
  res
) => {
  try {
    const customerProfileId =
      getCustomerProfileId(req);

    if (!customerProfileId) {
      return res.status(401).json({
        success: false,
        message:
          "Valid customer account is required.",
      });
    }

    const result = await pool.query(
      `
        ${travellerSelect}

        WHERE
          traveller.customer_profile_id = $1
          AND traveller.is_active = TRUE

        ORDER BY
          CASE traveller.relationship
            WHEN 'SELF' THEN 1
            WHEN 'SPOUSE' THEN 2
            WHEN 'SON' THEN 3
            WHEN 'DAUGHTER' THEN 4
            WHEN 'FATHER' THEN 5
            WHEN 'MOTHER' THEN 6
            ELSE 7
          END,
          traveller.full_name
      `,
      [customerProfileId]
    );

    const summary =
      result.rows.reduce(
        (current, traveller) => {
          const category = String(
            traveller.passenger_category ||
            ""
          ).toLowerCase();

          current.total += 1;

          if (
            Object.prototype
              .hasOwnProperty.call(
                current,
                category
              )
          ) {
            current[category] += 1;
          }

          return current;
        },
        {
          total: 0,
          infant: 0,
          child: 0,
          adult: 0,
          senior: 0,
        }
      );

    return res.json({
      success: true,
      travellers: result.rows,
      summary,
    });
  } catch (error) {
    console.error(
      "Get customer saved travellers failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load saved travellers.",
    });
  }
};

const createSavedTraveller = async (
  req,
  res
) => {
  const client =
    await pool.connect();

  let transactionStarted = false;

  try {
    const customerProfileId =
      getCustomerProfileId(req);

    if (!customerProfileId) {
      return res.status(401).json({
        success: false,
        message:
          "Valid customer account is required.",
      });
    }

    const validation =
      validatePayload(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const duplicateResult =
      await client.query(
        `
          ${travellerSelect}

          WHERE
            traveller.customer_profile_id = $1

            AND LOWER(
              TRIM(traveller.full_name)
            ) = LOWER(TRIM($2))

            AND traveller.date_of_birth = $3
            AND traveller.is_active = TRUE

          LIMIT 1
        `,
        [
          customerProfileId,
          validation.fullName,
          validation.dateOfBirth,
        ]
      );

    if (
      duplicateResult.rows.length
    ) {
      await client.query("COMMIT");
      transactionStarted = false;

      return res.status(200).json({
        success: true,
        reused: true,
        message:
          "Existing saved traveller reused successfully.",
        traveller:
          duplicateResult.rows[0],
      });
    }

    const insertResult =
      await client.query(
        `
          INSERT INTO saved_travellers (
            customer_profile_id,
            full_name,
            relationship,
            gender,
            date_of_birth,
            phone,
            email
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
          )
          RETURNING *
        `,
        [
          customerProfileId,
          validation.fullName,
          validation.relationship,
          validation.gender,
          validation.dateOfBirth,
          validation.phone,
          validation.email,
        ]
      );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message:
        "Traveller saved successfully.",
      traveller: {
        ...insertResult.rows[0],
        age: validation.age,
        passenger_category:
          validation.passengerCategory,
      },
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch {}
    }

    console.error(
      "Create customer saved traveller failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to save traveller.",
    });
  } finally {
    client.release();
  }
};

const updateSavedTraveller = async (
  req,
  res
) => {
  try {
    const customerProfileId =
      getCustomerProfileId(req);

    const travellerId = Number(
      req.params.id
    );

    if (!customerProfileId) {
      return res.status(401).json({
        success: false,
        message:
          "Valid customer account is required.",
      });
    }

    if (
      !Number.isInteger(travellerId) ||
      travellerId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid traveller ID is required.",
      });
    }

    const validation =
      validatePayload(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const result = await pool.query(
      `
        UPDATE saved_travellers
        SET
          full_name = $1,
          relationship = $2,
          gender = $3,
          date_of_birth = $4,
          phone = $5,
          email = $6,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = $7
          AND customer_profile_id = $8
          AND is_active = TRUE
        RETURNING *
      `,
      [
        validation.fullName,
        validation.relationship,
        validation.gender,
        validation.dateOfBirth,
        validation.phone,
        validation.email,
        travellerId,
        customerProfileId,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message:
          "Saved traveller not found.",
      });
    }

    return res.json({
      success: true,
      message:
        "Traveller updated successfully.",
      traveller: {
        ...result.rows[0],
        age: validation.age,
        passenger_category:
          validation.passengerCategory,
      },
    });
  } catch (error) {
    console.error(
      "Update customer saved traveller failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update traveller.",
    });
  }
};

const deleteSavedTraveller = async (
  req,
  res
) => {
  try {
    const customerProfileId =
      getCustomerProfileId(req);

    const travellerId = Number(
      req.params.id
    );

    if (!customerProfileId) {
      return res.status(401).json({
        success: false,
        message:
          "Valid customer account is required.",
      });
    }

    if (
      !Number.isInteger(travellerId) ||
      travellerId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid traveller ID is required.",
      });
    }

    const result = await pool.query(
      `
        UPDATE saved_travellers
        SET
          is_active = FALSE,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = $1
          AND customer_profile_id = $2
          AND is_active = TRUE
        RETURNING id
      `,
      [
        travellerId,
        customerProfileId,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message:
          "Saved traveller not found.",
      });
    }

    return res.json({
      success: true,
      message:
        "Traveller removed successfully.",
    });
  } catch (error) {
    console.error(
      "Delete customer saved traveller failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to remove traveller.",
    });
  }
};

module.exports = {
  createSavedTraveller,
  getSavedTravellers,
  updateSavedTraveller,
  deleteSavedTraveller,
};
