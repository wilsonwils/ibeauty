import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";

// Import UserProvider (we'll create this)
import { UserProvider } from "./context/UserContext.jsx";
import { TrialProvider } from "./context/TrialContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <TrialProvider>
         <App />
        </TrialProvider>
      </UserProvider>
    </BrowserRouter>
  </StrictMode>
);
