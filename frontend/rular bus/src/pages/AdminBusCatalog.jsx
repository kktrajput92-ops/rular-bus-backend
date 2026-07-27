import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_BASE } from "../api/api";
import {
  RBButton,
  RBCard,
  RBInput,
  RBTable,
} from "../rds/components";
import AdminSidebar from "../components/admin/AdminSidebar";

const API = `${API_BASE}/bus-catalog`;

const selectStyle = {
  width: "100%",
  minHeight: 42,
  padding: "9px 11px",
  borderRadius: 8,
  border: "1px solid var(--erp-border, #cbd5e1)",
  background: "var(--erp-surface, #ffffff)",
  color: "var(--erp-text, #0f172a)",
};

const textareaStyle = {
  width: "100%",
  minHeight: 90,
  padding: 11,
  borderRadius: 8,
  border: "1px solid var(--erp-border, #cbd5e1)",
  background: "var(--erp-surface, #ffffff)",
  color: "var(--erp-text, #0f172a)",
  resize: "vertical",
  boxSizing: "border-box",
};

const emptyManufacturerForm = {
  name: "",
  code: "",
  country: "",
  description: "",
  logo_url: "",
  sort_order: 0,
  is_active: true,
};

const emptyModelForm = {
  manufacturer_id: "",
  name: "",
  code: "",
  model_category: "COACH",
  fuel_type: "",
  axle_type: "",
  length_meters: "",
  description: "",
  sort_order: 0,
  is_active: true,
};

const emptyVariantForm = {
  model_id: "",
  name: "",
  code: "",
  body_type: "STANDARD_SEATER",
  layout_mode: "FULL_SEATER",
  deck_type: "LOWER_ONLY",
  is_ac: false,
  is_sleeper: false,
  default_capacity: "",
  default_preset: "",
  description: "",
  sort_order: 0,
  is_active: true,
};

function AdminBusCatalog() {
  const [activeTab, setActiveTab] =
    useState("MANUFACTURERS");

  const [summary, setSummary] =
    useState({
      manufacturers: 0,
      models: 0,
      body_variants: 0,
      templates: 0,
    });

  const [
    manufacturers,
    setManufacturers,
  ] = useState([]);

  const [models, setModels] =
    useState([]);

  const [variants, setVariants] =
    useState([]);

  const [
    manufacturerForm,
    setManufacturerForm,
  ] = useState(
    emptyManufacturerForm
  );

  const [modelForm, setModelForm] =
    useState(emptyModelForm);

  const [
    variantForm,
    setVariantForm,
  ] = useState(emptyVariantForm);

  const [
    editingManufacturerId,
    setEditingManufacturerId,
  ] = useState(null);

  const [
    editingModelId,
    setEditingModelId,
  ] = useState(null);

  const [
    editingVariantId,
    setEditingVariantId,
  ] = useState(null);

  const [
    selectedManufacturerId,
    setSelectedManufacturerId,
  ] = useState("");

  const [selectedModelId, setSelectedModelId] =
    useState("");

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
      window.__busCatalogToastTimer
    );

    window.__busCatalogToastTimer =
      window.setTimeout(() => {
        setToast((old) => ({
          ...old,
          visible: false,
        }));
      }, 3500);
  };

  const requestJson = async (
    url,
    options = {}
  ) => {
    const response = await fetch(
      url,
      options
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Request failed."
      );
    }

    return data;
  };

  const loadSummary = async () => {
    const data = await requestJson(
      `${API}/summary`
    );

    setSummary(data.summary || {});
  };

  const loadManufacturers = async () => {
    const data = await requestJson(
      `${API}/manufacturers?include_inactive=true`
    );

    setManufacturers(
      data.manufacturers || []
    );
  };

  const loadModels = async (
    manufacturerId = ""
  ) => {
    const query =
      manufacturerId
        ? `?manufacturer_id=${manufacturerId}&include_inactive=true`
        : "?include_inactive=true";

    const data = await requestJson(
      `${API}/models${query}`
    );

    setModels(data.models || []);
  };

  const loadVariants = async (
    modelId = ""
  ) => {
    const query =
      modelId
        ? `?model_id=${modelId}&include_inactive=true`
        : "?include_inactive=true";

    const data = await requestJson(
      `${API}/body-variants${query}`
    );

    setVariants(
      data.body_variants || []
    );
  };

  const loadAll = async () => {
    try {
      setLoading(true);

      await Promise.all([
        loadSummary(),
        loadManufacturers(),
        loadModels(),
        loadVariants(),
      ]);
    } catch (error) {
      console.error(
        "Load bus catalog failed:",
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
    loadAll();
  }, []);

  const handleManufacturerChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setManufacturerForm((old) => ({
      ...old,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleModelChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setModelForm((old) => ({
      ...old,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleVariantChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setVariantForm((old) => ({
      ...old,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const saveManufacturer = async (
    event
  ) => {
    event.preventDefault();

    try {
      setLoading(true);

      const url =
        editingManufacturerId
          ? `${API}/manufacturers/${editingManufacturerId}`
          : `${API}/manufacturers`;

      const method =
        editingManufacturerId
          ? "PUT"
          : "POST";

      const data = await requestJson(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ...manufacturerForm,
            sort_order: Number(
              manufacturerForm.sort_order ||
                0
            ),
          }),
        }
      );

      showToast(
        data.message,
        "success"
      );

      setManufacturerForm(
        emptyManufacturerForm
      );

      setEditingManufacturerId(
        null
      );

      await Promise.all([
        loadSummary(),
        loadManufacturers(),
      ]);
    } catch (error) {
      showToast(
        error.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const saveModel = async (
    event
  ) => {
    event.preventDefault();

    try {
      setLoading(true);

      const url =
        editingModelId
          ? `${API}/models/${editingModelId}`
          : `${API}/models`;

      const method =
        editingModelId
          ? "PUT"
          : "POST";

      const data = await requestJson(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ...modelForm,
            manufacturer_id:
              Number(
                modelForm.manufacturer_id
              ),
            length_meters:
              modelForm.length_meters ===
              ""
                ? null
                : Number(
                    modelForm.length_meters
                  ),
            sort_order: Number(
              modelForm.sort_order || 0
            ),
          }),
        }
      );

      showToast(
        data.message,
        "success"
      );

      setModelForm(
        emptyModelForm
      );

      setEditingModelId(null);

      await Promise.all([
        loadSummary(),
        loadModels(
          selectedManufacturerId
        ),
        loadManufacturers(),
      ]);
    } catch (error) {
      showToast(
        error.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const saveVariant = async (
    event
  ) => {
    event.preventDefault();

    try {
      setLoading(true);

      const url =
        editingVariantId
          ? `${API}/body-variants/${editingVariantId}`
          : `${API}/body-variants`;

      const method =
        editingVariantId
          ? "PUT"
          : "POST";

      const data = await requestJson(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ...variantForm,
            model_id: Number(
              variantForm.model_id
            ),
            default_capacity:
              variantForm.default_capacity ===
              ""
                ? null
                : Number(
                    variantForm.default_capacity
                  ),
            sort_order: Number(
              variantForm.sort_order ||
                0
            ),
          }),
        }
      );

      showToast(
        data.message,
        "success"
      );

      setVariantForm(
        emptyVariantForm
      );

      setEditingVariantId(null);

      await Promise.all([
        loadSummary(),
        loadVariants(selectedModelId),
        loadModels(
          selectedManufacturerId
        ),
        loadManufacturers(),
      ]);
    } catch (error) {
      showToast(
        error.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const editManufacturer = (
    item
  ) => {
    setManufacturerForm({
      name: item.name || "",
      code: item.code || "",
      country:
        item.country || "",
      description:
        item.description || "",
      logo_url:
        item.logo_url || "",
      sort_order:
        item.sort_order || 0,
      is_active:
        Boolean(item.is_active),
    });

    setEditingManufacturerId(
      item.id
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const editModel = (item) => {
    setModelForm({
      manufacturer_id:
        String(
          item.manufacturer_id || ""
        ),
      name: item.name || "",
      code: item.code || "",
      model_category:
        item.model_category ||
        "COACH",
      fuel_type:
        item.fuel_type || "",
      axle_type:
        item.axle_type || "",
      length_meters:
        item.length_meters ?? "",
      description:
        item.description || "",
      sort_order:
        item.sort_order || 0,
      is_active:
        Boolean(item.is_active),
    });

    setEditingModelId(item.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const editVariant = (item) => {
    setVariantForm({
      model_id: String(
        item.model_id || ""
      ),
      name: item.name || "",
      code: item.code || "",
      body_type:
        item.body_type ||
        "STANDARD_SEATER",
      layout_mode:
        item.layout_mode ||
        "FULL_SEATER",
      deck_type:
        item.deck_type ||
        "LOWER_ONLY",
      is_ac:
        Boolean(item.is_ac),
      is_sleeper:
        Boolean(item.is_sleeper),
      default_capacity:
        item.default_capacity ?? "",
      default_preset:
        item.default_preset || "",
      description:
        item.description || "",
      sort_order:
        item.sort_order || 0,
      is_active:
        Boolean(item.is_active),
    });

    setEditingVariantId(item.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deactivate = async (
    resource,
    id
  ) => {
    if (
      !window.confirm(
        "Deactivate this record?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const data = await requestJson(
        `${API}/${resource}/${id}`,
        {
          method: "DELETE",
        }
      );

      showToast(
        data.message,
        "success"
      );

      await loadAll();
    } catch (error) {
      showToast(
        error.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredManufacturers =
    useMemo(() => {
      const term =
        search.trim().toLowerCase();

      if (!term) {
        return manufacturers;
      }

      return manufacturers.filter(
        (item) =>
          `${item.name} ${item.code} ${item.country || ""}`
            .toLowerCase()
            .includes(term)
      );
    }, [
      manufacturers,
      search,
    ]);

  const filteredModels =
    useMemo(() => {
      const term =
        search.trim().toLowerCase();

      return models.filter((item) => {
        const matchesManufacturer =
          !selectedManufacturerId ||
          Number(
            item.manufacturer_id
          ) ===
            Number(
              selectedManufacturerId
            );

        const matchesSearch =
          !term ||
          `${item.name} ${item.code} ${item.manufacturer_name || ""}`
            .toLowerCase()
            .includes(term);

        return (
          matchesManufacturer &&
          matchesSearch
        );
      });
    }, [
      models,
      selectedManufacturerId,
      search,
    ]);

  const filteredVariants =
    useMemo(() => {
      const term =
        search.trim().toLowerCase();

      return variants.filter(
        (item) => {
          const matchesModel =
            !selectedModelId ||
            Number(item.model_id) ===
              Number(
                selectedModelId
              );

          const matchesSearch =
            !term ||
            `${item.name} ${item.code} ${item.model_name || ""} ${item.manufacturer_name || ""}`
              .toLowerCase()
              .includes(term);

          return (
            matchesModel &&
            matchesSearch
          );
        }
      );
    }, [
      variants,
      selectedModelId,
      search,
    ]);

  const manufacturerColumns = [
    {
      key: "name",
      title: "Manufacturer",
    },
    {
      key: "code",
      title: "Code",
    },
    {
      key: "country",
      title: "Country",
    },
    {
      key: "model_count",
      title: "Models",
    },
    {
      key: "variant_count",
      title: "Variants",
    },
    {
      key: "is_active",
      title: "Status",
      render: (item) =>
        item.is_active
          ? "Active"
          : "Inactive",
    },
    {
      key: "actions",
      title: "Actions",
      render: (item) => (
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
              editManufacturer(item)
            }
          >
            Edit
          </RBButton>

          {item.is_active && (
            <RBButton
              variant="danger"
              onClick={() =>
                deactivate(
                  "manufacturers",
                  item.id
                )
              }
            >
              Deactivate
            </RBButton>
          )}
        </div>
      ),
    },
  ];

  const modelColumns = [
    {
      key: "manufacturer_name",
      title: "Manufacturer",
    },
    {
      key: "name",
      title: "Model",
    },
    {
      key: "code",
      title: "Code",
    },
    {
      key: "model_category",
      title: "Category",
    },
    {
      key: "variant_count",
      title: "Variants",
    },
    {
      key: "is_active",
      title: "Status",
      render: (item) =>
        item.is_active
          ? "Active"
          : "Inactive",
    },
    {
      key: "actions",
      title: "Actions",
      render: (item) => (
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
              editModel(item)
            }
          >
            Edit
          </RBButton>

          {item.is_active && (
            <RBButton
              variant="danger"
              onClick={() =>
                deactivate(
                  "models",
                  item.id
                )
              }
            >
              Deactivate
            </RBButton>
          )}
        </div>
      ),
    },
  ];

  const variantColumns = [
    {
      key: "manufacturer_name",
      title: "Manufacturer",
    },
    {
      key: "model_name",
      title: "Model",
    },
    {
      key: "name",
      title: "Body Variant",
    },
    {
      key: "body_type",
      title: "Body Type",
    },
    {
      key: "layout_mode",
      title: "Layout Mode",
    },
    {
      key: "deck_type",
      title: "Deck",
    },
    {
      key: "is_active",
      title: "Status",
      render: (item) =>
        item.is_active
          ? "Active"
          : "Inactive",
    },
    {
      key: "actions",
      title: "Actions",
      render: (item) => (
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
              editVariant(item)
            }
          >
            Edit
          </RBButton>

          {item.is_active && (
            <RBButton
              variant="danger"
              onClick={() =>
                deactivate(
                  "body-variants",
                  item.id
                )
              }
            >
              Deactivate
            </RBButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      {toast.visible && (
        <div
          style={{
            position: "fixed",
            top: 18,
            left: "50%",
            transform:
              "translateX(-50%)",
            zIndex: 99999,
            width:
              "min(calc(100vw - 30px), 480px)",
            padding: "14px 18px",
            borderRadius: 14,
            textAlign: "center",
            fontWeight: 700,
            boxShadow:
              "0 12px 30px rgba(15,23,42,.25)",
            background:
              toast.type === "success"
                ? "#dcfce7"
                : toast.type === "error"
                ? "#fee2e2"
                : "#dbeafe",
            color:
              toast.type === "success"
                ? "#14532d"
                : toast.type === "error"
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

      <AdminSidebar />

      <main
        style={{
          minHeight: "100vh",
          padding: 24,
          background:
            "var(--erp-bg, #f8fafc)",
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
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 22,
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
                🚌 Bus Catalog
              </h1>

              <p
                style={{
                  color:
                    "var(--erp-text-muted, #64748b)",
                }}
              >
                Manufacturer, model और
                body-layout variants
              </p>
            </div>

            <RBInput
              placeholder="Search catalog..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 14,
              marginBottom: 22,
            }}
          >
            {[
              [
                "Manufacturers",
                summary.manufacturers,
              ],
              [
                "Models",
                summary.models,
              ],
              [
                "Body Variants",
                summary.body_variants,
              ],
              [
                "Layout Templates",
                summary.templates,
              ],
            ].map(([label, value]) => (
              <RBCard
                key={label}
                style={{
                  padding: 18,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                  }}
                >
                  {value || 0}
                </div>

                <div
                  style={{
                    color:
                      "var(--erp-text-muted, #64748b)",
                  }}
                >
                  {label}
                </div>
              </RBCard>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            {[
              [
                "MANUFACTURERS",
                "Manufacturers",
              ],
              ["MODELS", "Models"],
              [
                "VARIANTS",
                "Body Variants",
              ],
            ].map(([value, label]) => (
              <RBButton
                key={value}
                variant={
                  activeTab === value
                    ? "primary"
                    : "secondary"
                }
                onClick={() =>
                  setActiveTab(value)
                }
              >
                {label}
              </RBButton>
            ))}
          </div>

          {activeTab ===
            "MANUFACTURERS" && (
            <>
              <RBCard
                style={{
                  padding: 20,
                  marginBottom: 20,
                }}
              >
                <h2>
                  {editingManufacturerId
                    ? "Edit Manufacturer"
                    : "Add Manufacturer"}
                </h2>

                <form
                  onSubmit={
                    saveManufacturer
                  }
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 14,
                    }}
                  >
                    <RBInput
                      name="name"
                      placeholder="Manufacturer Name"
                      value={
                        manufacturerForm.name
                      }
                      onChange={
                        handleManufacturerChange
                      }
                      required
                    />

                    <RBInput
                      name="code"
                      placeholder="Code (auto allowed)"
                      value={
                        manufacturerForm.code
                      }
                      onChange={
                        handleManufacturerChange
                      }
                    />

                    <RBInput
                      name="country"
                      placeholder="Country"
                      value={
                        manufacturerForm.country
                      }
                      onChange={
                        handleManufacturerChange
                      }
                    />

                    <RBInput
                      type="number"
                      name="sort_order"
                      placeholder="Sort Order"
                      value={
                        manufacturerForm.sort_order
                      }
                      onChange={
                        handleManufacturerChange
                      }
                    />

                    <RBInput
                      name="logo_url"
                      placeholder="Logo URL"
                      value={
                        manufacturerForm.logo_url
                      }
                      onChange={
                        handleManufacturerChange
                      }
                    />

                    <label>
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={
                          manufacturerForm.is_active
                        }
                        onChange={
                          handleManufacturerChange
                        }
                      />{" "}
                      Active
                    </label>
                  </div>

                  <textarea
                    name="description"
                    placeholder="Description"
                    value={
                      manufacturerForm.description
                    }
                    onChange={
                      handleManufacturerChange
                    }
                    style={{
                      ...textareaStyle,
                      marginTop: 14,
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      marginTop: 14,
                    }}
                  >
                    <RBButton
                      type="submit"
                      disabled={loading}
                    >
                      {editingManufacturerId
                        ? "Update Manufacturer"
                        : "Add Manufacturer"}
                    </RBButton>

                    {editingManufacturerId && (
                      <RBButton
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setEditingManufacturerId(
                            null
                          );
                          setManufacturerForm(
                            emptyManufacturerForm
                          );
                        }}
                      >
                        Cancel
                      </RBButton>
                    )}
                  </div>
                </form>
              </RBCard>

              <RBCard
                style={{ padding: 18 }}
              >
                <RBTable
                  columns={
                    manufacturerColumns
                  }
                  data={
                    filteredManufacturers
                  }
                />
              </RBCard>
            </>
          )}

          {activeTab === "MODELS" && (
            <>
              <RBCard
                style={{
                  padding: 20,
                  marginBottom: 20,
                }}
              >
                <h2>
                  {editingModelId
                    ? "Edit Bus Model"
                    : "Add Bus Model"}
                </h2>

                <form
                  onSubmit={saveModel}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 14,
                    }}
                  >
                    <select
                      name="manufacturer_id"
                      value={
                        modelForm.manufacturer_id
                      }
                      onChange={
                        handleModelChange
                      }
                      style={selectStyle}
                      required
                    >
                      <option value="">
                        Select Manufacturer
                      </option>

                      {manufacturers.map(
                        (item) => (
                          <option
                            key={item.id}
                            value={item.id}
                          >
                            {item.name}
                          </option>
                        )
                      )}
                    </select>

                    <RBInput
                      name="name"
                      placeholder="Model Name"
                      value={
                        modelForm.name
                      }
                      onChange={
                        handleModelChange
                      }
                      required
                    />

                    <RBInput
                      name="code"
                      placeholder="Model Code"
                      value={
                        modelForm.code
                      }
                      onChange={
                        handleModelChange
                      }
                    />

                    <select
                      name="model_category"
                      value={
                        modelForm.model_category
                      }
                      onChange={
                        handleModelChange
                      }
                      style={selectStyle}
                    >
                      {[
                        "CITY_BUS",
                        "INTERCITY",
                        "COACH",
                        "SCHOOL_BUS",
                        "STAFF_BUS",
                        "MINI_BUS",
                        "CHASSIS",
                        "ELECTRIC_BUS",
                        "CUSTOM",
                      ].map((value) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {value}
                        </option>
                      ))}
                    </select>

                    <RBInput
                      name="fuel_type"
                      placeholder="Fuel Type"
                      value={
                        modelForm.fuel_type
                      }
                      onChange={
                        handleModelChange
                      }
                    />

                    <RBInput
                      name="axle_type"
                      placeholder="Axle Type"
                      value={
                        modelForm.axle_type
                      }
                      onChange={
                        handleModelChange
                      }
                    />

                    <RBInput
                      type="number"
                      step="0.01"
                      name="length_meters"
                      placeholder="Length (meters)"
                      value={
                        modelForm.length_meters
                      }
                      onChange={
                        handleModelChange
                      }
                    />

                    <RBInput
                      type="number"
                      name="sort_order"
                      placeholder="Sort Order"
                      value={
                        modelForm.sort_order
                      }
                      onChange={
                        handleModelChange
                      }
                    />

                    <label>
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={
                          modelForm.is_active
                        }
                        onChange={
                          handleModelChange
                        }
                      />{" "}
                      Active
                    </label>
                  </div>

                  <textarea
                    name="description"
                    placeholder="Description"
                    value={
                      modelForm.description
                    }
                    onChange={
                      handleModelChange
                    }
                    style={{
                      ...textareaStyle,
                      marginTop: 14,
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      marginTop: 14,
                    }}
                  >
                    <RBButton
                      type="submit"
                      disabled={loading}
                    >
                      {editingModelId
                        ? "Update Model"
                        : "Add Model"}
                    </RBButton>

                    {editingModelId && (
                      <RBButton
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setEditingModelId(
                            null
                          );
                          setModelForm(
                            emptyModelForm
                          );
                        }}
                      >
                        Cancel
                      </RBButton>
                    )}
                  </div>
                </form>
              </RBCard>

              <RBCard
                style={{
                  padding: 18,
                  marginBottom: 16,
                }}
              >
                <select
                  value={
                    selectedManufacturerId
                  }
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    setSelectedManufacturerId(
                      value
                    );

                    loadModels(value);
                  }}
                  style={{
                    ...selectStyle,
                    maxWidth: 360,
                  }}
                >
                  <option value="">
                    All Manufacturers
                  </option>

                  {manufacturers.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </option>
                    )
                  )}
                </select>
              </RBCard>

              <RBCard
                style={{ padding: 18 }}
              >
                <RBTable
                  columns={modelColumns}
                  data={filteredModels}
                />
              </RBCard>
            </>
          )}

          {activeTab ===
            "VARIANTS" && (
            <>
              <RBCard
                style={{
                  padding: 20,
                  marginBottom: 20,
                }}
              >
                <h2>
                  {editingVariantId
                    ? "Edit Body Variant"
                    : "Add Body Variant"}
                </h2>

                <form
                  onSubmit={saveVariant}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 14,
                    }}
                  >
                    <select
                      name="model_id"
                      value={
                        variantForm.model_id
                      }
                      onChange={
                        handleVariantChange
                      }
                      style={selectStyle}
                      required
                    >
                      <option value="">
                        Select Bus Model
                      </option>

                      {models.map(
                        (item) => (
                          <option
                            key={item.id}
                            value={item.id}
                          >
                            {
                              item.manufacturer_name
                            }{" "}
                            — {item.name}
                          </option>
                        )
                      )}
                    </select>

                    <RBInput
                      name="name"
                      placeholder="Variant Name"
                      value={
                        variantForm.name
                      }
                      onChange={
                        handleVariantChange
                      }
                      required
                    />

                    <RBInput
                      name="code"
                      placeholder="Variant Code"
                      value={
                        variantForm.code
                      }
                      onChange={
                        handleVariantChange
                      }
                    />

                    <select
                      name="body_type"
                      value={
                        variantForm.body_type
                      }
                      onChange={
                        handleVariantChange
                      }
                      style={selectStyle}
                    >
                      {[
                        "STANDARD_SEATER",
                        "PUSHBACK_SEATER",
                        "PREMIUM_RECLINER",
                        "SEMI_SLEEPER",
                        "FULL_SLEEPER",
                        "MIXED_SEATER_SLEEPER",
                        "PRIVATE_SLEEPER",
                        "PRIVATE_SHARING_SLEEPER",
                        "CUSTOM",
                      ].map((value) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {value}
                        </option>
                      ))}
                    </select>

                    <select
                      name="layout_mode"
                      value={
                        variantForm.layout_mode
                      }
                      onChange={
                        handleVariantChange
                      }
                      style={selectStyle}
                    >
                      {[
                        "FULL_SEATER",
                        "PUSHBACK_SEATER",
                        "SEMI_SLEEPER",
                        "FULL_SLEEPER",
                        "MIXED_SEATER_SLEEPER",
                        "CUSTOM",
                      ].map((value) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {value}
                        </option>
                      ))}
                    </select>

                    <select
                      name="deck_type"
                      value={
                        variantForm.deck_type
                      }
                      onChange={
                        handleVariantChange
                      }
                      style={selectStyle}
                    >
                      <option value="LOWER_ONLY">
                        Lower Only
                      </option>

                      <option value="LOWER_UPPER">
                        Lower + Upper
                      </option>

                      <option value="CUSTOM">
                        Custom
                      </option>
                    </select>

                    <RBInput
                      type="number"
                      name="default_capacity"
                      placeholder="Default Capacity"
                      value={
                        variantForm.default_capacity
                      }
                      onChange={
                        handleVariantChange
                      }
                    />

                    <RBInput
                      name="default_preset"
                      placeholder="Default Layout Preset"
                      value={
                        variantForm.default_preset
                      }
                      onChange={
                        handleVariantChange
                      }
                    />

                    <RBInput
                      type="number"
                      name="sort_order"
                      placeholder="Sort Order"
                      value={
                        variantForm.sort_order
                      }
                      onChange={
                        handleVariantChange
                      }
                    />

                    <label>
                      <input
                        type="checkbox"
                        name="is_ac"
                        checked={
                          variantForm.is_ac
                        }
                        onChange={
                          handleVariantChange
                        }
                      />{" "}
                      AC Variant
                    </label>

                    <label>
                      <input
                        type="checkbox"
                        name="is_sleeper"
                        checked={
                          variantForm.is_sleeper
                        }
                        onChange={
                          handleVariantChange
                        }
                      />{" "}
                      Sleeper Variant
                    </label>

                    <label>
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={
                          variantForm.is_active
                        }
                        onChange={
                          handleVariantChange
                        }
                      />{" "}
                      Active
                    </label>
                  </div>

                  <textarea
                    name="description"
                    placeholder="Description"
                    value={
                      variantForm.description
                    }
                    onChange={
                      handleVariantChange
                    }
                    style={{
                      ...textareaStyle,
                      marginTop: 14,
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      marginTop: 14,
                    }}
                  >
                    <RBButton
                      type="submit"
                      disabled={loading}
                    >
                      {editingVariantId
                        ? "Update Variant"
                        : "Add Variant"}
                    </RBButton>

                    {editingVariantId && (
                      <RBButton
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setEditingVariantId(
                            null
                          );
                          setVariantForm(
                            emptyVariantForm
                          );
                        }}
                      >
                        Cancel
                      </RBButton>
                    )}
                  </div>
                </form>
              </RBCard>

              <RBCard
                style={{
                  padding: 18,
                  marginBottom: 16,
                }}
              >
                <select
                  value={selectedModelId}
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    setSelectedModelId(
                      value
                    );

                    loadVariants(value);
                  }}
                  style={{
                    ...selectStyle,
                    maxWidth: 440,
                  }}
                >
                  <option value="">
                    All Models
                  </option>

                  {models.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {
                          item.manufacturer_name
                        }{" "}
                        — {item.name}
                      </option>
                    )
                  )}
                </select>
              </RBCard>

              <RBCard
                style={{ padding: 18 }}
              >
                <RBTable
                  columns={variantColumns}
                  data={filteredVariants}
                />
              </RBCard>
            </>
          )}

          {loading && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background:
                  "rgba(15,23,42,.18)",
                display: "grid",
                placeItems: "center",
                zIndex: 9998,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  padding: "14px 20px",
                  borderRadius: 12,
                  background: "#ffffff",
                  boxShadow:
                    "0 10px 30px rgba(15,23,42,.2)",
                  fontWeight: 700,
                }}
              >
                Loading...
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default AdminBusCatalog;
