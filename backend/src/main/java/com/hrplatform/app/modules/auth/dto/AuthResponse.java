package com.hrplatform.app.modules.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType
) {
    public static AuthResponse bearer(String accessToken, String refreshToken){
        return new AuthResponse(accessToken, refreshToken, "Bearer");
    }
}
