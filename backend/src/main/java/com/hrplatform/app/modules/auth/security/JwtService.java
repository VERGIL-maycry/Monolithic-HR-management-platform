package com.hrplatform.app.modules.auth.security;

import com.hrplatform.app.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {
    private final JwtProperties jwtProperties;
    private final SecretKey signingKey;

    public JwtService(@org.jetbrains.annotations.NotNull JwtProperties jwtProperties){
        this.jwtProperties=jwtProperties;
        this.signingKey=Keys.hmacShaKeyFor(jwtProperties.secret().getBytes());
    }
    public String generateAccessToken(UserDetails userDetails){
        return buildToken(userDetails, jwtProperties.accessTokenExpirationMs());
    }
    public String generateRefreshToken(UserDetails userDetails){
        return buildToken(userDetails, jwtProperties.refreshTokenExpirationMs());
    }
    private String buildToken(UserDetails userDetails, long expirationMs){
        Date now = new Date();
        return Jwts.builder().subject(userDetails.getUsername())
                .issuedAt(now)
                .expiration(new Date(now.getTime()+expirationMs))
                .signWith(signingKey)
                .compact();
    }
    public String extractUsername(String token){
        return extractClaim(token, Claims::getSubject);
    }
    public boolean isTokenValid(String token, UserDetails userDetails){
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }
    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
}
    private <T> T extractClaim(String token, Function<Claims, T> resolver){
        Claims claims =Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return resolver.apply(claims);
    }
}