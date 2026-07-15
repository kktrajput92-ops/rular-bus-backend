import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { PermissionProvider } from "./context/PermissionContext";

createRoot(document.getElementById("root")).render(
  <PermissionProvider>
    <App />
  </PermissionProvider>
);
