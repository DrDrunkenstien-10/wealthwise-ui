import React, { useEffect, useState, useRef } from "react";
import keycloak from "./keycloak";
import axiosInstance from "./api/axiosInstance"; // adjust path if needed

const KeycloakProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [keycloakReady, setKeycloakReady] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;

      keycloak
        .init({
          onLoad: "login-required",
          pkceMethod: "S256",
          redirectUri: "https://auth.wealthwise.ajadhav.com/dashboard",
          checkLoginIframe: false,
        })
        .then(async auth => {
          if (auth && keycloak.token) {
            try {
              await axiosInstance.post("/users"); // ✅ Notify backend
              console.log("✅ User registration/login sent to backend.");
            } catch (err) {
              console.error("❌ Failed to notify backend about user login:", err);
            }
          }

          window.keycloak = keycloak;
          setIsAuthenticated(auth);
          setKeycloakReady(true);
        })
        .catch(err => {
          console.error("Keycloak init error:", err);
        });
    }
  }, []);

  if (!keycloakReady) return <div>🔐 Initializing authentication...</div>;
  if (!isAuthenticated) return <div>❌ Authentication failed</div>;

  return children;
};

export default KeycloakProvider;
