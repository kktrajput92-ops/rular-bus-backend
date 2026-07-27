import { createRoot } from "react-dom/client";
import "./index.css";
import "./theme/theme.css";
import "./styles/rularBusGlobalIcon.css";

import App from "./App.jsx";
import { PermissionProvider } from "./context/PermissionContext.jsx";
import { CustomerAuthProvider } from "./context/CustomerAuthContext.jsx";
import { ThemeProvider } from "./theme/ThemeProvider.jsx";
import { installRularBusIcons } from "./utils/installRularBusIcons";

installRularBusIcons();

createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <PermissionProvider>
      <CustomerAuthProvider>
        <App />
      </CustomerAuthProvider>
    </PermissionProvider>
  </ThemeProvider>
);
