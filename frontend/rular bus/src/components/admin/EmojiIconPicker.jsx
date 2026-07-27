import { useMemo, useState } from "react";

const ICON_GROUPS = [
  {
    title: "Locations",
    icons: [
      "📍",
      "📌",
      "🚏",
      "🚌",
      "🛣️",
      "🏙️",
      "🏘️",
      "🏡",
      "🏢",
      "🏫",
      "🏥",
      "🏪",
      "🏬",
      "🏨",
      "🏭",
      "🌆",
      "🌉",
    ],
  },
  {
    title: "Travel",
    icons: [
      "⬆️",
      "⬇️",
      "➡️",
      "⬅️",
      "🧭",
      "🚦",
      "🚧",
      "🛑",
      "⛽",
      "🚉",
      "✈️",
      "🚕",
      "🚗",
      "🚚",
      "🚜",
    ],
  },
  {
    title: "Food & Break",
    icons: [
      "🍽️",
      "🍛",
      "🍲",
      "🍱",
      "🥘",
      "☕",
      "🫖",
      "🥤",
      "🍴",
      "🥗",
      "🍚",
      "🍞",
      "🚻",
      "🛏️",
      "🅿️",
      "💧",
    ],
  },
  {
    title: "Services",
    icons: [
      "🔧",
      "🛠️",
      "⚙️",
      "🩺",
      "🚑",
      "👮",
      "🛡️",
      "☎️",
      "📞",
      "💳",
      "🎫",
      "🎟️",
      "ℹ️",
      "⭐",
      "✅",
      "⚠️",
    ],
  },
];

export default function EmojiIconPicker({
  value,
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return ICON_GROUPS;
    }

    return ICON_GROUPS.filter((group) =>
      group.title.toLowerCase().includes(query)
    );
  }, [search]);

  const selectIcon = (icon) => {
    onChange(icon);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.controlRow}>
        <button
          type="button"
          style={styles.previewButton}
          onClick={() => setIsOpen(true)}
          aria-label="Choose icon"
        >
          <span style={styles.previewIcon}>
            {value || "📍"}
          </span>
          <span>Choose Icon</span>
        </button>

        {value && (
          <button
            type="button"
            style={styles.clearButton}
            onClick={() => onChange("")}
          >
            Clear
          </button>
        )}
      </div>

      {isOpen && (
        <div style={styles.overlay}>
          <button
            type="button"
            style={styles.backdrop}
            onClick={() => setIsOpen(false)}
            aria-label="Close icon picker"
          />

          <section style={styles.modal}>
            <header style={styles.header}>
              <div>
                <h3 style={styles.title}>
                  Choose Location Icon
                </h3>

                <p style={styles.subtitle}>
                  Select an icon for this location type.
                </p>
              </div>

              <button
                type="button"
                style={styles.closeButton}
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </header>

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              style={styles.searchInput}
              placeholder="Search category..."
              autoFocus
            />

            <div style={styles.groups}>
              {filteredGroups.map((group) => (
                <div key={group.title}>
                  <h4 style={styles.groupTitle}>
                    {group.title}
                  </h4>

                  <div style={styles.iconGrid}>
                    {group.icons.map((icon) => (
                      <button
                        key={`${group.title}-${icon}`}
                        type="button"
                        style={{
                          ...styles.iconButton,
                          ...(value === icon
                            ? styles.selectedIcon
                            : {}),
                        }}
                        onClick={() => selectIcon(icon)}
                        title={group.title}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.customSection}>
              <label style={styles.customLabel}>
                Custom emoji
              </label>

              <input
                value={value || ""}
                onChange={(event) =>
                  onChange(event.target.value)
                }
                style={styles.customInput}
                placeholder="Paste or type custom emoji"
                maxLength={12}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    display: "grid",
    gap: 8,
  },
  controlRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  previewButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    padding: "9px 13px",
    borderRadius: 10,
    border: "1px solid var(--erp-border)",
    background: "var(--erp-input)",
    color: "var(--erp-text)",
    fontWeight: 700,
    cursor: "pointer",
  },
  previewIcon: {
    fontSize: 24,
    lineHeight: 1,
  },
  clearButton: {
    borderRadius: 10,
    border: "1px solid var(--erp-border)",
    background: "var(--erp-card)",
    color: "var(--erp-text)",
    padding: "9px 12px",
    cursor: "pointer",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "grid",
    placeItems: "center",
    padding: 16,
  },
  backdrop: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    border: 0,
    background: "rgba(15, 23, 42, 0.62)",
    cursor: "default",
  },
  modal: {
    position: "relative",
    zIndex: 1,
    width: "min(620px, 100%)",
    maxHeight: "88vh",
    overflowY: "auto",
    borderRadius: 18,
    border: "1px solid var(--erp-border)",
    background: "var(--erp-card)",
    color: "var(--erp-text)",
    padding: 20,
    boxShadow: "0 24px 80px rgba(0,0,0,.32)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  title: {
    margin: 0,
    color: "var(--erp-heading)",
  },
  subtitle: {
    margin: "5px 0 0",
    opacity: 0.7,
  },
  closeButton: {
    border: "1px solid var(--erp-border)",
    background: "var(--erp-input)",
    color: "var(--erp-text)",
    borderRadius: 9,
    width: 38,
    height: 38,
    cursor: "pointer",
  },
  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: 18,
    padding: "11px 12px",
    borderRadius: 10,
    border: "1px solid var(--erp-border)",
    background: "var(--erp-input)",
    color: "var(--erp-text)",
  },
  groups: {
    display: "grid",
    gap: 18,
    marginTop: 18,
  },
  groupTitle: {
    margin: "0 0 9px",
    color: "var(--erp-heading)",
  },
  iconGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(48px, 1fr))",
    gap: 9,
  },
  iconButton: {
    minHeight: 48,
    borderRadius: 10,
    border: "1px solid var(--erp-border)",
    background: "var(--erp-input)",
    fontSize: 24,
    cursor: "pointer",
  },
  selectedIcon: {
    outline: "3px solid var(--erp-primary)",
  },
  customSection: {
    display: "grid",
    gap: 7,
    marginTop: 20,
    paddingTop: 18,
    borderTop: "1px solid var(--erp-border)",
  },
  customLabel: {
    fontWeight: 700,
  },
  customInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    borderRadius: 10,
    border: "1px solid var(--erp-border)",
    background: "var(--erp-input)",
    color: "var(--erp-text)",
    fontSize: 20,
  },
};
