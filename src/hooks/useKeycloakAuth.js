import keycloak from '../keycloak';

export const useKeycloakAuth = () => {
  const logout = () => {
    keycloak.logout({
      redirectUri: `${window.location.origin}?loggedOut=true`,
    });
  };

  const getToken = () => keycloak.token;
  const getUserInfo = () => keycloak.tokenParsed;

  return { logout, getToken, getUserInfo };
};
