import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import { App } from "./teams-app";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // no-op (PWA still works without SW in dev if blocked)
    });
  });
}

ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

