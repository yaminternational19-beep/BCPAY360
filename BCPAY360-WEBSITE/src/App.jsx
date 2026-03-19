import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import colors from "./styles/colors";
import OneSignal from "react-onesignal";

const App = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const toggleTheme = () => setIsDarkTheme((p) => !p);

  useEffect(() => {
    const savedTheme = localStorage.getItem("appTheme");
    if (savedTheme === "dark") setIsDarkTheme(true);
  }, []);

  useEffect(() => {
  const init = async () => {
    try {
      if (!window.__ONESIGNAL_INIT__) {
        await OneSignal.init({
          appId: "72686d46-e925-405c-a69f-97e568dd7c42",
          allowLocalhostAsSecureOrigin: true,
        });

        window.__ONESIGNAL_INIT__ = true;

        const perm = await OneSignal.Notifications.permission;

        if (perm !== "granted") {
          await OneSignal.Notifications.requestPermission();
        }

        const id = await OneSignal.User.PushSubscription.id;

        if (id) {
          console.log("OneSignal Player ID:", id);
          localStorage.setItem("onesignal_player_id", id);
        }

        OneSignal.User.PushSubscription.addEventListener("change", (event) => {
          const newId = event?.current?.id;

          if (newId) {
            console.log("Player ID updated:", newId);
            localStorage.setItem("onesignal_player_id", newId);
          }
        });
      }
    } catch (e) {
      console.error("OneSignal init error:", e);
    }
  };

  init();
}, []);

  useEffect(() => {
    localStorage.setItem("appTheme", isDarkTheme ? "dark" : "light");
    document.body.style.backgroundColor = isDarkTheme
      ? colors.darkBg
      : colors.background;
    document.body.style.color = isDarkTheme
      ? colors.textLight
      : colors.textMain;
  }, [isDarkTheme]);

  return (
    <BrowserRouter>
      <AppRoutes isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />
      <ToastContainer position="top-right" autoClose={3000} newestOnTop closeOnClick pauseOnHover draggable theme="colored" />
    </BrowserRouter>
  );
};

export default App;