import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "https://auth.wealthwise.ajadhav.com", // Keycloak server URL
  realm: "wealthwise",          // Your realm
  clientId: "frontend-client",  // Your client
});

export default keycloak;
