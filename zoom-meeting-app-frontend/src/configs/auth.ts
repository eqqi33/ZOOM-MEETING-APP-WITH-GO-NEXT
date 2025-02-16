export default {
  meEndpoint: '/auth/me',
  loginEndpoint: '/jwt/login',
  storageTokenKeyName: 'accessToken',
  onTokenExpiration: 'refreshToken' // logout | refreshToken
}
