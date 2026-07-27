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

const calculateAge = (dateOfBirth) => {
  const birthDate = new Date(
    `${dateOfBirth}T00:00:00`
  );

  if (Number.isNaN(birthDate.getTime())) {
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
  if (!Number.isInteger(age) || age < 0) {
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

const validateTravellerPayload = (
  payload = {}
) => {
  const ownerPhone = normalizePhone(
    payload.owner_phone
  );

  const ownerEmail = normalizeEmail(
    payload.owner_email
  );

  const fullName = String(
    payload.full_name || ""
  )
    .replace(/\s+/g, " ")
    .trim();

  const relationship = String(
    payload.relationship || "OTHER"
  )
    .trim()
    .toUpperCase();

  const gender = String(
    payload.gender || ""
  )
    .trim()
    .toUpperCase();

  const dateOfBirth = String(
    payload.date_of_birth || ""
  ).trim();

  const travellerPhone = normalizePhone(
    payload.phone
  );

  const travellerEmail = normalizeEmail(
    payload.email
  );

  if (
    !ownerPhone ||
    !/^[0-9]{10,15}$/.test(ownerPhone)
  ) {
    return {
      valid: false,
      message:
        "Valid customer contact number is required.",
    };
  }

  if (
    ownerEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      ownerEmail
    )
  ) {
    return {
      valid: false,
      message:
        "Customer email format is invalid.",
    };
  }

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
        "Valid gender is required.",
    };
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      dateOfBirth
    )
  ) {
    return {
      valid: false,
      message:
        "Valid date of birth is required.",
    };
  }

  const age = calculateAge(
    dateOfBirth
  );

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
    travellerPhone &&
    !/^[0-9]{10,15}$/.test(
      travellerPhone
    )
  ) {
    return {
      valid: false,
      message:
        "Traveller phone number is invalid.",
    };
  }

  if (
    travellerEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      travellerEmail
    )
  ) {
    return {
      valid: false,
      message:
        "Traveller email format is invalid.",
    };
  }

  return {
    valid: true,
    ownerPhone,
    ownerEmail,
    fullName,
    relationship,
    gender,
    dateOfBirth,
    travellerPhone,
    travellerEmail,
    age,
    passengerCategory:
      getPassengerCategory(age),
  };
};

const getOrCreateCustomerProfile = async (
  client,
  {
    phone,
    email,
    fullName,
  }
) => {
  const existingProfile =
    await client.query(
      `
        SELECT *
        FROM customer_profiles
        WHERE phone = $1
        LIMIT 1
      `,
      [phone]
    );

  if (existingProfile.rows.length) {
    const updatedProfile =
      await client.query(
        `
          UPDATE customer_profiles
          SET
            full_name = COALESCE(
              NULLIF($1, ''),
              full_name
            ),
            email = COALESCE(
              $2,
              email
            ),
            is_active = TRUE,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE id = $3
          RETURNING *
        `,
        [
          fullName || null,
          email || null,
          existingProfile.rows[0].id,
        ]
      );

    return updatedProfile.rows[0];
  }

  const createdProfile =
    await client.query(
      `
        INSERT INTO customer_profiles (
          full_name,
          phone,
          email
        )
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [
        fullName || null,
        phone,
        email || null,
      ]
    );

  return createdProfile.rows[0];
};

const createSavedTraveller = async (
  req,
  res
) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const validation =
      validateTravellerPayload(
        req.body
      );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const customerProfile =
      await getOrCreateCustomerProfile(
        client,
        {
          phone:
            validation.ownerPhone,

          email:
            validation.ownerEmail,

          fullName:
            req.body.owner_name,
        }
      );

    const duplicateResult =
      await client.query(
        `
          SELECT
            traveller.*,

            DATE_PART(
              'year',
              AGE(
                CURRENT_DATE,
                traveller.date_of_birth
              )
            )::INTEGER AS age

          FROM saved_travellers traveller

          WHERE traveller.customer_profile_id = $1
            AND LOWER(TRIM(traveller.full_name)) =
                LOWER(TRIM($2))
            AND traveller.date_of_birth = $3
            AND traveller.is_active = TRUE

          LIMIT 1
        `,
        [
          customerProfile.id,
          validation.fullName,
          validation.dateOfBirth,
        ]
      );

    if (duplicateResult.rows.length) {
      const existingTraveller =
        duplicateResult.rows[0];

      await client.query("COMMIT");
      transactionStarted = false;

      return res.status(200).json({
        success: true,
        message:
          "Existing saved traveller reused successfully.",

        reused: true,

        customer_profile:
          customerProfile,

        traveller: {
          ...existingTraveller,

          passenger_category:
            getPassengerCategory(
              Number(
                existingTraveller.age
              )
            ),
        },
      });
    }

    const result = await client.query(
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
        customerProfile.id,
        validation.fullName,
        validation.relationship,
        validation.gender,
        validation.dateOfBirth,
        validation.travellerPhone,
        validation.travellerEmail,
      ]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message:
        "Traveller saved successfully.",

      customer_profile:
        customerProfile,

      traveller: {
        ...result.rows[0],
        age: validation.age,
        passenger_category:
          validation.passengerCategory,
      },
    });
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }

    console.error(
      "Create saved traveller failed:",
      error
    );

    return res
      .status(error.status || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to save traveller.",
      });
  } finally {
    client.release();
  }
};

const getSavedTravellers = async (
  req,
  res
) => {
  try {
    const ownerPhone = normalizePhone(
      req.query.phone
    );

    if (
      !ownerPhone ||
      !/^[0-9]{10,15}$/.test(
        ownerPhone
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid customer contact number is required.",
      });
    }

    const result = await pool.query(
      `
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

        INNER JOIN customer_profiles profile
          ON profile.id =
             traveller.customer_profile_id

        WHERE profile.phone = $1
          AND profile.is_active = TRUE
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
      [ownerPhone]
    );

    const summary =
      result.rows.reduce(
        (current, traveller) => {
          const category =
            String(
              traveller.passenger_category
            ).toLowerCase();

          current.total += 1;

          if (
            Object.prototype.hasOwnProperty.call(
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
      "Get saved travellers failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load saved travellers.",
    });
  }
};

const updateSavedTraveller = async (
  req,
  res
) => {
  try {
    const travellerId = Number(
      req.params.id
    );

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
      validateTravellerPayload(
        req.body
      );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const result = await pool.query(
      `
        UPDATE saved_travellers traveller
        SET
          full_name = $1,
          relationship = $2,
          gender = $3,
          date_of_birth = $4,
          phone = $5,
          email = $6,
          updated_at =
            CURRENT_TIMESTAMP
        FROM customer_profiles profile
        WHERE traveller.id = $7
          AND profile.id =
              traveller.customer_profile_id
          AND profile.phone = $8
          AND traveller.is_active = TRUE
        RETURNING traveller.*
      `,
      [
        validation.fullName,
        validation.relationship,
        validation.gender,
        validation.dateOfBirth,
        validation.travellerPhone,
        validation.travellerEmail,
        travellerId,
        validation.ownerPhone,
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
      "Update saved traveller failed:",
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
    const travellerId = Number(
      req.params.id
    );

    const ownerPhone = normalizePhone(
      req.body.owner_phone
    );

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

    if (
      !ownerPhone ||
      !/^[0-9]{10,15}$/.test(
        ownerPhone
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid customer contact number is required.",
      });
    }

    const result = await pool.query(
      `
        UPDATE saved_travellers traveller
        SET
          is_active = FALSE,
          updated_at =
            CURRENT_TIMESTAMP
        FROM customer_profiles profile
        WHERE traveller.id = $1
          AND profile.id =
              traveller.customer_profile_id
          AND profile.phone = $2
          AND traveller.is_active = TRUE
        RETURNING traveller.*
      `,
      [
        travellerId,
        ownerPhone,
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
      "Delete saved traveller failed:",
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
