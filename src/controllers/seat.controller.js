const pool = require("../config/db");

const SELLABLE_TYPES = [
  "SEAT",
  "SEATER",
  "PUSHBACK_SEAT",
  "SEMI_SLEEPER",
  "LOWER_BERTH",
  "UPPER_BERTH",
];

const normalizeSeatReference = (value) =>
  String(value || "").trim();

const getSeatStatus = async (req, res) => {
  try {
    const scheduleId = Number(
      req.params.schedule_id
    );

    if (
      !Number.isInteger(scheduleId) ||
      scheduleId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid schedule ID is required.",
      });
    }

    const scheduleResult =
      await pool.query(
        `
        SELECT
          schedule.id AS schedule_id,
          schedule.bus_id,
          schedule.route_id,
          schedule.departure_time,
          schedule.arrival_time,
          schedule.duration_minutes,

          bus.bus_name,
          bus.bus_number,
          bus.bus_type,
          bus.total_seats,

          TRIM(route.source) AS source,
          TRIM(route.destination)
            AS destination,

          route.distance_km,
          route.estimated_time

        FROM schedules schedule

        INNER JOIN buses bus
          ON bus.id = schedule.bus_id

        INNER JOIN routes route
          ON route.id = schedule.route_id

        WHERE schedule.id = $1
        `,
        [scheduleId]
      );

    if (!scheduleResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found.",
      });
    }

    const schedule =
      scheduleResult.rows[0];

    const layoutResult =
      await pool.query(
        `
        SELECT
          layout.id,
          layout.bus_id,
          layout.seat_no,
          layout.seat_type,
          layout.deck,
          layout.row_no,
          layout.col_no,
          layout.fare,

          layout.side,
          layout.position_kind,
          layout.berth_group,

          layout.is_driver,
          layout.is_door,
          layout.is_aisle,
          layout.is_extra,

          layout.private_booking_enabled,
          layout.sharing_booking_enabled,
          layout.sharing_capacity,
          layout.private_fare,
          layout.sharing_fare

        FROM seat_layouts layout

        WHERE layout.bus_id = $1

        ORDER BY
          CASE
            WHEN layout.deck = 'LOWER'
              THEN 1
            WHEN layout.deck = 'UPPER'
              THEN 2
            ELSE 3
          END,
          layout.row_no,
          layout.col_no
        `,
        [schedule.bus_id]
      );

    if (!layoutResult.rows.length) {
      return res.status(404).json({
        success: false,
        message:
          "Seat layout is not configured for this bus.",
      });
    }

    /*
     * Confirmed bookings:
     * - booking_passengers contains all seats for
     *   transactional multi-passenger bookings.
     * - bookings is retained as legacy fallback.
     */
    const bookedResult =
      await pool.query(
        `
        SELECT DISTINCT
          occupied.seat_number,
          occupied.booking_mode,
          occupied.berth_group,
          occupied.sharing_slot

        FROM (
          SELECT
            passenger.seat_number,
            passenger.booking_mode,
            passenger.berth_group,
            passenger.sharing_slot

          FROM booking_passengers passenger

          INNER JOIN bookings booking
            ON booking.id =
              passenger.booking_id

          WHERE booking.schedule_id = $1
            AND LOWER(
              booking.booking_status
            ) = 'confirmed'

          UNION ALL

          SELECT
            booking.seat_number,
            booking.booking_mode,
            booking.berth_group,
            booking.sharing_slot

          FROM bookings booking

          WHERE booking.schedule_id = $1
            AND LOWER(
              booking.booking_status
            ) = 'confirmed'
            AND NOT EXISTS (
              SELECT 1
              FROM booking_passengers passenger
              WHERE passenger.booking_id =
                booking.id
            )
        ) occupied

        ORDER BY occupied.seat_number
        `,
        [scheduleId]
      );

    /*
     * Only unexpired active locks affect availability.
     */
    const lockedResult =
      await pool.query(
        `
        SELECT
          lock.seat_number,
          lock.booking_mode,
          lock.berth_group,
          lock.sharing_slot,
          lock.expires_at

        FROM seat_locks lock

        WHERE lock.schedule_id = $1
          AND LOWER(lock.status) =
            'locked'
          AND (
            lock.expires_at IS NULL
            OR lock.expires_at >
              CURRENT_TIMESTAMP
          )

        ORDER BY lock.seat_number
        `,
        [scheduleId]
      );

    const bookedSeats = new Set();
    const rawBookedSeats = new Set();
    const privateBookedGroups =
      new Set();

    const sharingOccupancy = {};

    bookedResult.rows.forEach(
      (item) => {
        const seatNumber =
          normalizeSeatReference(
            item.seat_number
          );

        const bookingMode =
          String(
            item.booking_mode || "SEAT"
          ).toUpperCase();

        const berthGroup =
          normalizeSeatReference(
            item.berth_group
          );

        if (seatNumber) {
          rawBookedSeats.add(seatNumber);
          bookedSeats.add(seatNumber);
        }

        if (
          bookingMode === "PRIVATE" &&
          berthGroup
        ) {
          privateBookedGroups.add(
            berthGroup
          );
        }

        if (
          bookingMode === "SHARING" &&
          berthGroup
        ) {
          sharingOccupancy[
            berthGroup
          ] =
            Number(
              sharingOccupancy[
                berthGroup
              ] || 0
            ) + 1;
        }
      }
    );

    const lockedSeats = new Set();
    const privateLockedGroups =
      new Set();

    const sharingLockedOccupancy = {};

    lockedResult.rows.forEach(
      (item) => {
        const seatNumber =
          normalizeSeatReference(
            item.seat_number
          );

        const bookingMode =
          String(
            item.booking_mode || "SEAT"
          ).toUpperCase();

        const berthGroup =
          normalizeSeatReference(
            item.berth_group
          );

        if (seatNumber) {
          lockedSeats.add(seatNumber);
        }

        if (
          bookingMode === "PRIVATE" &&
          berthGroup
        ) {
          privateLockedGroups.add(
            berthGroup
          );
        }

        if (
          bookingMode === "SHARING" &&
          berthGroup
        ) {
          sharingLockedOccupancy[
            berthGroup
          ] =
            Number(
              sharingLockedOccupancy[
                berthGroup
              ] || 0
            ) + 1;
        }
      }
    );

    /*
     * Legacy compatibility:
     * Older bookings store numeric positions such as
     * 1, 2, 3 while the graphical layout may use A1,
     * A2, SL1, etc.
     *
     * Map numeric legacy positions to the ordered
     * sellable layout positions. Any number outside
     * the saved layout remains an orphaned legacy
     * booking and is reported in the response.
     */
    const orderedSellableLayout =
      layoutResult.rows.filter(
        (item) =>
          SELLABLE_TYPES.includes(
            String(
              item.seat_type || ""
            ).toUpperCase()
          )
      );

    const layoutSeatReferences =
      new Set(
        orderedSellableLayout.map(
          (item) =>
            normalizeSeatReference(
              item.seat_no
            )
        )
      );

    const legacySeatMappings = {};
    const orphanedLegacySeats = [];

    rawBookedSeats.forEach(
      (seatReference) => {
        if (
          layoutSeatReferences.has(
            seatReference
          )
        ) {
          return;
        }

        if (
          !/^[0-9]+$/.test(
            seatReference
          )
        ) {
          orphanedLegacySeats.push(
            seatReference
          );
          return;
        }

        const legacyPosition =
          Number(seatReference);

        const mappedLayoutItem =
          orderedSellableLayout[
            legacyPosition - 1
          ];

        if (!mappedLayoutItem) {
          orphanedLegacySeats.push(
            seatReference
          );
          return;
        }

        const mappedSeatReference =
          normalizeSeatReference(
            mappedLayoutItem.seat_no
          );

        legacySeatMappings[
          seatReference
        ] = mappedSeatReference;

        bookedSeats.add(
          mappedSeatReference
        );
      }
    );

    const layout =
      layoutResult.rows.map(
        (item) => {
          const seatNumber =
            normalizeSeatReference(
              item.seat_no
            );

          const seatType =
            String(
              item.seat_type || ""
            ).toUpperCase();

          const berthGroup =
            normalizeSeatReference(
              item.berth_group
            );

          const sellable =
            SELLABLE_TYPES.includes(
              seatType
            );

          const sharingCapacity =
            Number(
              item.sharing_capacity || 1
            );

          const bookedSharing =
            berthGroup
              ? Number(
                  sharingOccupancy[
                    berthGroup
                  ] || 0
                )
              : 0;

          const lockedSharing =
            berthGroup
              ? Number(
                  sharingLockedOccupancy[
                    berthGroup
                  ] || 0
                )
              : 0;

          const sharingUsed =
            bookedSharing +
            lockedSharing;

          const privateBlocked =
            Boolean(
              berthGroup &&
                (
                  privateBookedGroups.has(
                    berthGroup
                  ) ||
                  privateLockedGroups.has(
                    berthGroup
                  ) ||
                  sharingUsed > 0
                )
            );

          const sharingBlocked =
            Boolean(
              berthGroup &&
                (
                  privateBookedGroups.has(
                    berthGroup
                  ) ||
                  privateLockedGroups.has(
                    berthGroup
                  ) ||
                  sharingUsed >=
                    sharingCapacity
                )
            );

          const directlyUnavailable =
            bookedSeats.has(
              seatNumber
            ) ||
            lockedSeats.has(
              seatNumber
            );

          const baseFare =
            Number(item.fare || 0);

          return {
            ...item,

            seat_no: seatNumber,
            seat_type: seatType,
            deck:
              String(
                item.deck || "LOWER"
              ).toUpperCase(),

            fare: baseFare,

            private_fare:
              item.private_fare ===
                null ||
              item.private_fare ===
                undefined
                ? baseFare
                : Number(
                    item.private_fare
                  ),

            sharing_fare:
              item.sharing_fare ===
                null ||
              item.sharing_fare ===
                undefined
                ? null
                : Number(
                    item.sharing_fare
                  ),

            sharing_capacity:
              sharingCapacity,

            sellable,

            booked:
              sellable &&
              directlyUnavailable,

            locked:
              sellable &&
              lockedSeats.has(
                seatNumber
              ),

            private_available:
              sellable &&
              Boolean(
                item
                  .private_booking_enabled
              ) &&
              !directlyUnavailable &&
              !privateBlocked,

            sharing_available:
              sellable &&
              Boolean(
                item
                  .sharing_booking_enabled
              ) &&
              !directlyUnavailable &&
              !sharingBlocked,

            sharing_used:
              sharingUsed,

            sharing_remaining:
              Math.max(
                0,
                sharingCapacity -
                  sharingUsed
              ),
          };
        }
      );

    const lowerLayout =
      layout.filter(
        (item) =>
          item.deck === "LOWER"
      );

    const upperLayout =
      layout.filter(
        (item) =>
          item.deck === "UPPER"
      );

    const sellableLayout =
      layout.filter(
        (item) => item.sellable
      );

    return res.json({
      success: true,

      schedule,

      layout,

      decks: {
        lower: lowerLayout,
        upper: upperLayout,
      },

      summary: {
        total_layout_items:
          layout.length,

        passenger_positions:
          sellableLayout.length,

        lower_positions:
          lowerLayout.filter(
            (item) =>
              item.sellable
          ).length,

        upper_positions:
          upperLayout.filter(
            (item) =>
              item.sellable
          ).length,

        booked_positions:
          sellableLayout.filter(
            (item) => item.booked
          ).length,

        available_positions:
          sellableLayout.filter(
            (item) =>
              !item.booked &&
              (
                item.private_available ||
                item.sharing_available
              )
          ).length,
      },

      booked_seats:
        Array.from(bookedSeats),

      raw_booked_seats:
        Array.from(rawBookedSeats),

      legacy_seat_mappings:
        legacySeatMappings,

      orphaned_legacy_seats:
        orphanedLegacySeats,

      inventory_warning:
        orphanedLegacySeats.length > 0
          ? `There are ${orphanedLegacySeats.length} legacy booked seat references outside the saved graphical layout.`
          : null,

      locked_seats:
        Array.from(lockedSeats),

      private_booked_groups:
        Array.from(
          privateBookedGroups
        ),

      private_locked_groups:
        Array.from(
          privateLockedGroups
        ),

      sharing_occupancy:
        sharingOccupancy,

      sharing_locked_occupancy:
        sharingLockedOccupancy,
    });
  } catch (error) {
    console.error(
      "Get dynamic seat status failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load seat availability.",
    });
  }
};

module.exports = {
  getSeatStatus,
};
