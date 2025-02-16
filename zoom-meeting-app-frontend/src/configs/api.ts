export default {
    auth: {
        me: '/auth/me',
        login: '/auth/login',
        logout: '/auth/logout',
        userKeyName: 'ownUserData',
        refreshTokenKeyName: 'ownRefreshToken',
        storageTokenKeyName: 'ownAccessToken',
        onTokenExpiration: 'logout', // logout | refreshToken
    },
};
