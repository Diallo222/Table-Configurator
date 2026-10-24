import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
// one family, weight + width axes (62% display, 86% data, 100% text)
import "@fontsource-variable/archivo/wdth.css";
import "./styles/base.css";
import App from "./app/App.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
