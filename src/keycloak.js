import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:3001", // Keycloak server URL
  realm: "wealthwise",          // Your realm
  clientId: "frontend-client",  // Your client
});

export default keycloak;
