import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_BASE } from "../api/api";
import {
  RBButton,
  RBInput,
  RBTable,
} from "../rds/components";

const BUS_API =
  `${API_BASE}/buses`;

const CATALOG_API =
  `${API_BASE}/bus-catalog`;

const selectStyle = {
  width: "100%",
  minHeight: 42,
  padding: "10px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background:
    "var(--erp-surface, #ffffff)",
  color:
    "var(--erp-text, #0f172a)",
};

const emptyForm = {
  bus_name: "",
  bus_number: "",

  manufacturer_id: "",
  model_id: "",
  body_variant_id: "",
  seat_layout_template_id: "",

  bus_type: "",
  rto_approved_seats: "",
  physical_seats: "",

  registration_number: "",
  operator_name: "",
  bus_status: "Active",

  is_ac: false,
  is_sleeper: false,
};

function AdminBus() {
  const [buses, setBuses] =
    useState([]);

  const [
    manufacturers,
    setManufacturers,
  ] = useState([]);

  const [models, setModels] =
    useState([]);

  const [
    bodyVariants,
    setBodyVariants,
  ] = useState([]);

  const [
    layoutTemplates,
    setLayoutTemplates,
  ] = useState([]);

  const [form, setForm] =
    useState(emptyForm);

  const [editingId, setEditingId] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [toast, setToast] =
    useState({
      visible: false,
      type: "info",
      text: "",
    });

  const showToast = (
    text,
    type = "info"
  ) => {
    setToast({
      visible: true,
      type,
      text,
    });

    window.clearTimeout(
      window.__adminBusToastTimer
    );

    window.__adminBusToastTimer =
      window.setTimeout(() => {
        setToast((old) => ({
          ...old,
          visible: false,
        }));
      }, 4000);
  };

  const requestJson = async (
    url,
    options = {}
  ) => {
    const response =
      await fetch(url, options);

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
          "Request failed."
      );
    }

    return data;
  };

  const loadBuses = async () => {
    const data =
      await requestJson(BUS_API);

    setBuses(data.buses || []);
  };

  const loadManufacturers =
    async () => {
      const data =
        await requestJson(
          `${CATALOG_API}/manufacturers`
        );

      setManufacturers(
        data.manufacturers || []
      );
    };

  const loadModels = async (
    manufacturerId
  ) => {
    if (!manufacturerId) {
      setModels([]);
      return [];
    }

    const data =
      await requestJson(
        `${CATALOG_API}/models?manufacturer_id=${manufacturerId}`
      );

    const rows =
      data.models || [];

    setModels(rows);

    return rows;
  };

  const loadBodyVariants =
    async (modelId) => {
      if (!modelId) {
        setBodyVariants([]);
        return [];
      }

      const data =
        await requestJson(
          `${CATALOG_API}/body-variants?model_id=${modelId}`
        );

      const rows =
        data.body_variants || [];

      setBodyVariants(rows);

      return rows;
    };

  const loadLayoutTemplates =
    async () => {
      const data =
        await requestJson(
          `${CATALOG_API}/layout-templates`
        );

      setLayoutTemplates(
        data.templates || []
      );
    };

  const loadInitialData =
    async () => {
      try {
        setLoading(true);

        await Promise.all([
          loadBuses(),
          loadManufacturers(),
          loadLayoutTemplates(),
        ]);
      } catch (error) {
        console.error(
          "Admin bus load failed:",
          error
        );

        showToast(
          error.message,
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadInitialData();
  }, []);

  const filteredTemplates =
    useMemo(() => {
      return layoutTemplates.filter(
        (template) => {
          const manufacturerMatch =
            !template.manufacturer_id ||
            Number(
              template.manufacturer_id
            ) ===
              Number(
                form.manufacturer_id
              );

          const modelMatch =
            !template.model_id ||
            Number(template.model_id) ===
              Number(form.model_id);

          const variantMatch =
            !template.body_variant_id ||
            Number(
              template.body_variant_id
            ) ===
              Number(
                form.body_variant_id
              );

          return (
            manufacturerMatch &&
            modelMatch &&
            variantMatch
          );
        }
      );
    }, [
      layoutTemplates,
      form.manufacturer_id,
      form.model_id,
      form.body_variant_id,
    ]);

  const filteredBuses =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return buses;
      }

      return buses.filter((bus) =>
        [
          bus.bus_name,
          bus.bus_number,
          bus.bus_type,
          bus.registration_number,
          bus.operator_name,
          bus.manufacturer_name,
          bus.model_name,
          bus.body_variant_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term)
      );
    }, [buses, search]);

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((old) => ({
      ...old,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleManufacturerChange =
    async (event) => {
      const manufacturerId =
        event.target.value;

      setForm((old) => ({
        ...old,
        manufacturer_id:
          manufacturerId,
        model_id: "",
        body_variant_id: "",
        seat_layout_template_id:
          "",
      }));

      setBodyVariants([]);

      try {
        await loadModels(
          manufacturerId
        );
      } catch (error) {
        showToast(
          error.message,
          "error"
        );
      }
    };

  const handleModelChange =
    async (event) => {
      const modelId =
        event.target.value;

      setForm((old) => ({
        ...old,
        model_id: modelId,
        body_variant_id: "",
        seat_layout_template_id:
          "",
      }));

      try {
        await loadBodyVariants(
          modelId
        );
      } catch (error) {
        showToast(
          error.message,
          "error"
        );
      }
    };

  const handleVariantChange = (
    event
  ) => {
    const variantId =
      event.target.value;

    const selectedVariant =
      bodyVariants.find(
        (variant) =>
          Number(variant.id) ===
          Number(variantId)
      );

    if (!selectedVariant) {
      setForm((old) => ({
        ...old,
        body_variant_id: "",
        seat_layout_template_id:
          "",
      }));

      return;
    }

    let busType = "Seater";

    if (
      selectedVariant.layout_mode ===
      "FULL_SLEEPER"
    ) {
      busType = "Sleeper";
    } else if (
      selectedVariant.layout_mode ===
      "SEMI_SLEEPER"
    ) {
      busType = "Semi Sleeper";
    } else if (
      selectedVariant.layout_mode ===
      "MIXED_SEATER_SLEEPER"
    ) {
      busType =
        "Seater + Sleeper";
    } else if (
      selectedVariant.layout_mode ===
      "PUSHBACK_SEATER"
    ) {
      busType =
        "Pushback Seater";
    } else if (
      selectedVariant.layout_mode ===
      "CUSTOM"
    ) {
      busType = "Custom";
    }

    setForm((old) => ({
      ...old,

      body_variant_id:
        variantId,

      seat_layout_template_id:
        "",

      bus_type: busType,

      is_ac:
        Boolean(
          selectedVariant.is_ac
        ),

      is_sleeper:
        Boolean(
          selectedVariant
            .is_sleeper
        ),

      physical_seats:
        selectedVariant
          .default_capacity ??
        old.physical_seats,

      rto_approved_seats:
        old.rto_approved_seats ||
        selectedVariant
          .default_capacity ||
        "",
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModels([]);
    setBodyVariants([]);
  };

  const saveBus = async (
    event
  ) => {
    event.preventDefault();

    try {
      setLoading(true);

      const url = editingId
        ? `${BUS_API}/${editingId}`
        : BUS_API;

      const method = editingId
        ? "PUT"
        : "POST";

      const payload = {
        ...form,

        manufacturer_id:
          form.manufacturer_id
            ? Number(
                form.manufacturer_id
              )
            : null,

        model_id: form.model_id
          ? Number(form.model_id)
          : null,

        body_variant_id:
          form.body_variant_id
            ? Number(
                form.body_variant_id
              )
            : null,

        seat_layout_template_id:
          form
            .seat_layout_template_id
            ? Number(
                form
                  .seat_layout_template_id
              )
            : null,

        rto_approved_seats:
          Number(
            form.rto_approved_seats
          ),

        physical_seats:
          Number(
            form.physical_seats
          ),
      };

      const data =
        await requestJson(url, {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify(payload),
        });

      showToast(
        data.message,
        "success"
      );

      resetForm();
      await loadBuses();
    } catch (error) {
      console.error(
        "Save bus failed:",
        error
      );

      showToast(
        error.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const editBus = async (
    bus
  ) => {
    try {
      setLoading(true);

      const manufacturerId =
        bus.manufacturer_id
          ? String(
              bus.manufacturer_id
            )
          : "";

      const modelId =
        bus.model_id
          ? String(bus.model_id)
          : "";

      const variantId =
        bus.body_variant_id
          ? String(
              bus.body_variant_id
            )
          : "";

      if (manufacturerId) {
        await loadModels(
          manufacturerId
        );
      } else {
        setModels([]);
      }

      if (modelId) {
        await loadBodyVariants(
          modelId
        );
      } else {
        setBodyVariants([]);
      }

      setEditingId(bus.id);

      setForm({
        bus_name:
          bus.bus_name || "",

        bus_number:
          bus.bus_number || "",

        manufacturer_id:
          manufacturerId,

        model_id: modelId,

        body_variant_id:
          variantId,

        seat_layout_template_id:
          bus
            .seat_layout_template_id
            ? String(
                bus
                  .seat_layout_template_id
              )
            : "",

        bus_type:
          bus.bus_type || "",

        rto_approved_seats:
          bus.rto_approved_seats ??
          "",

        physical_seats:
          bus.physical_seats ??
          bus.total_seats ??
          "",

        registration_number:
          bus.registration_number ||
          "",

        operator_name:
          bus.operator_name || "",

        bus_status:
          bus.bus_status ||
          "Active",

        is_ac:
          Boolean(bus.is_ac),

        is_sleeper:
          Boolean(
            bus.is_sleeper
          ),
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      showToast(
        error.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteBus = async (
    id
  ) => {
    if (
      !window.confirm(
        "Delete this bus?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const data =
        await requestJson(
          `${BUS_API}/${id}`,
          {
            method: "DELETE",
          }
        );

      showToast(
        data.message,
        "success"
      );

      await loadBuses();
    } catch (error) {
      showToast(
        error.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "bus_name",
      title: "Bus Name",
    },
    {
      key: "bus_number",
      title: "Bus Number",
    },
    {
      key: "manufacturer_name",
      title: "Manufacturer",
      render: (bus) =>
        bus.manufacturer_name ||
        "—",
    },
    {
      key: "model_name",
      title: "Model",
      render: (bus) =>
        bus.model_name || "—",
    },
    {
      key: "body_variant_name",
      title: "Body Variant",
      render: (bus) =>
        bus.body_variant_name ||
        "—",
    },
    {
      key: "bus_type",
      title: "Bus Type",
    },
    {
      key: "physical_seats",
      title: "Physical Seats",
    },
    {
      key: "rto_approved_seats",
      title: "RTO Approved",
    },
    {
      key: "operator_name",
      title: "Operator",
    },
    {
      key: "bus_status",
      title: "Status",
    },
    {
      key: "actions",
      title: "Actions",
      render: (bus) => (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <RBButton
            variant="secondary"
            onClick={() =>
              editBus(bus)
            }
          >
            Edit
          </RBButton>

          <RBButton
            variant="danger"
            onClick={() =>
              deleteBus(bus.id)
            }
          >
            Delete
          </RBButton>

          <RBButton
            variant="primary"
            onClick={() => {
              window.location.href =
                `/admin/seat-layout/${bus.id}`;
            }}
          >
            Design Layout
          </RBButton>
        </div>
      ),
    },
  ];

  return (
    <>
      {toast.visible && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: 18,
            left: "50%",
            transform:
              "translateX(-50%)",
            zIndex: 99999,
            width:
              "min(calc(100vw - 30px), 500px)",
            padding: "14px 18px",
            borderRadius: 14,
            textAlign: "center",
            fontWeight: 700,
            boxShadow:
              "0 12px 32px rgba(15,23,42,.25)",
            background:
              toast.type ===
              "success"
                ? "#dcfce7"
                : toast.type ===
                  "error"
                ? "#fee2e2"
                : "#dbeafe",
            color:
              toast.type ===
              "success"
                ? "#14532d"
                : toast.type ===
                  "error"
                ? "#7f1d1d"
                : "#1e3a8a",
          }}
        >
          {toast.type === "success"
            ? "✅ "
            : toast.type === "error"
            ? "❌ "
            : "ℹ️ "}
          {toast.text}
        </div>
      )}

      <div
        style={{
          minHeight: "100vh",
          background:
            "var(--erp-bg, #f8fafc)",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 1500,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: 24,
              flexWrap: "wrap",
              gap: 15,
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  color:
                    "var(--erp-heading, #0f172a)",
                }}
              >
                🚍 Fleet Management
              </h1>

              <p
                style={{
                  color:
                    "var(--erp-text-muted, #64748b)",
                }}
              >
                Manufacturer, model,
                variant और layout
                configuration
              </p>
            </div>

            <RBInput
              placeholder="Search Bus..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <form
            onSubmit={saveBus}
            style={{
              background:
                "var(--erp-surface, #ffffff)",
              padding: 20,
              borderRadius: 14,
              marginBottom: 25,
              boxShadow:
                "0 4px 14px rgba(0,0,0,.08)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
              }}
            >
              {editingId
                ? "Edit Bus"
                : "Add Bus"}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 15,
              }}
            >
              <RBInput
                name="bus_name"
                placeholder="Bus Name"
                value={form.bus_name}
                onChange={handleChange}
                required
              />

              <RBInput
                name="bus_number"
                placeholder="Bus Number"
                value={form.bus_number}
                onChange={handleChange}
                required
              />

              <select
                name="manufacturer_id"
                value={
                  form.manufacturer_id
                }
                onChange={
                  handleManufacturerChange
                }
                style={selectStyle}
              >
                <option value="">
                  Select Manufacturer
                </option>

                {manufacturers.map(
                  (manufacturer) => (
                    <option
                      key={
                        manufacturer.id
                      }
                      value={
                        manufacturer.id
                      }
                    >
                      {
                        manufacturer.name
                      }
                    </option>
                  )
                )}
              </select>

              <select
                name="model_id"
                value={form.model_id}
                onChange={
                  handleModelChange
                }
                style={selectStyle}
                disabled={
                  !form.manufacturer_id
                }
              >
                <option value="">
                  Select Model
                </option>

                {models.map(
                  (model) => (
                    <option
                      key={model.id}
                      value={model.id}
                    >
                      {model.name}
                    </option>
                  )
                )}
              </select>

              <select
                name="body_variant_id"
                value={
                  form.body_variant_id
                }
                onChange={
                  handleVariantChange
                }
                style={selectStyle}
                disabled={
                  !form.model_id
                }
              >
                <option value="">
                  Select Body Variant
                </option>

                {bodyVariants.map(
                  (variant) => (
                    <option
                      key={variant.id}
                      value={variant.id}
                    >
                      {variant.name}
                    </option>
                  )
                )}
              </select>

              <select
                name="seat_layout_template_id"
                value={
                  form
                    .seat_layout_template_id
                }
                onChange={handleChange}
                style={selectStyle}
                disabled={
                  !filteredTemplates.length
                }
              >
                <option value="">
                  {filteredTemplates.length
                    ? "Select Layout Template"
                    : "No Layout Template"}
                </option>

                {filteredTemplates.map(
                  (template) => (
                    <option
                      key={template.id}
                      value={template.id}
                    >
                      {template.name}
                    </option>
                  )
                )}
              </select>

              <select
                name="bus_type"
                value={form.bus_type}
                onChange={handleChange}
                style={selectStyle}
                required
              >
                <option value="">
                  Select Bus Type
                </option>

                <option value="Seater">
                  Seater
                </option>

                <option value="Pushback Seater">
                  Pushback Seater
                </option>

                <option value="Semi Sleeper">
                  Semi Sleeper
                </option>

                <option value="Sleeper">
                  Sleeper
                </option>

                <option value="Seater + Sleeper">
                  Seater + Sleeper
                </option>

                <option value="Custom">
                  Custom
                </option>
              </select>

              <RBInput
                type="number"
                min="0"
                name="rto_approved_seats"
                placeholder="RTO Approved Seats"
                value={
                  form.rto_approved_seats
                }
                onChange={handleChange}
                required
              />

              <RBInput
                type="number"
                min="0"
                name="physical_seats"
                placeholder="Physical Seats"
                value={
                  form.physical_seats
                }
                onChange={handleChange}
                required
              />

              <RBInput
                name="registration_number"
                placeholder="Registration Number"
                value={
                  form.registration_number
                }
                onChange={handleChange}
                required
              />

              <RBInput
                name="operator_name"
                placeholder="Operator Name"
                value={
                  form.operator_name
                }
                onChange={handleChange}
                required
              />

              <select
                name="bus_status"
                value={form.bus_status}
                onChange={handleChange}
                style={selectStyle}
              >
                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>

                <option value="Maintenance">
                  Maintenance
                </option>

                <option value="Suspended">
                  Suspended
                </option>
              </select>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minHeight: 42,
                }}
              >
                <input
                  type="checkbox"
                  name="is_ac"
                  checked={form.is_ac}
                  onChange={handleChange}
                />
                AC Bus
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minHeight: 42,
                }}
              >
                <input
                  type="checkbox"
                  name="is_sleeper"
                  checked={
                    form.is_sleeper
                  }
                  onChange={handleChange}
                />
                Sleeper Bus
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 20,
              }}
            >
              <RBButton
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : editingId
                  ? "Update Bus"
                  : "Add Bus"}
              </RBButton>

              {editingId && (
                <RBButton
                  type="button"
                  variant="secondary"
                  onClick={resetForm}
                >
                  Cancel Edit
                </RBButton>
              )}

              <RBButton
                type="button"
                variant="secondary"
                onClick={() => {
                  window.location.href =
                    "/admin/bus-catalog";
                }}
              >
                Manage Bus Catalog
              </RBButton>
            </div>
          </form>

          <div
            style={{
              background:
                "var(--erp-surface, #ffffff)",
              borderRadius: 14,
              overflowX: "auto",
              boxShadow:
                "0 4px 14px rgba(0,0,0,.08)",
            }}
          >
            {filteredBuses.length ===
            0 ? (
              <div
                style={{
                  padding: 28,
                  textAlign: "center",
                }}
              >
                No Bus Found
              </div>
            ) : (
              <RBTable
                columns={columns}
                data={filteredBuses}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminBus;
