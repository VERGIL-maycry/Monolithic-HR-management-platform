package com.hrplatform.app.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

/**
 * Render (and many hosts) expose {@code DATABASE_URL} as {@code postgres://user:pass@host/db}.
 * Spring JDBC needs {@code jdbc:postgresql://...}.
 */
public final class DatabaseUrlParser {

    private DatabaseUrlParser() {
    }

    public static void applyFromEnvironment() {
        String raw = firstNonBlank(System.getenv("DATABASE_URL"), System.getenv("SPRING_DATASOURCE_URL"));
        if (raw == null || raw.isBlank()) {
            return;
        }
        if (raw.startsWith("jdbc:")) {
            System.setProperty("spring.datasource.url", raw);
            return;
        }
        if (!raw.startsWith("postgres://") && !raw.startsWith("postgresql://")) {
            return;
        }

        URI uri = URI.create(raw.replaceFirst("^postgres(ql)?://", "http://"));
        String userInfo = uri.getUserInfo();
        if (userInfo != null) {
            int colon = userInfo.indexOf(':');
            String user = colon >= 0 ? userInfo.substring(0, colon) : userInfo;
            String password = colon >= 0 ? userInfo.substring(colon + 1) : "";
            System.setProperty("spring.datasource.username", decode(user));
            System.setProperty("spring.datasource.password", decode(password));
        }

        String host = uri.getHost();
        int port = uri.getPort() > 0 ? uri.getPort() : 5432;
        String path = uri.getPath() == null ? "" : uri.getPath();
        String db = path.startsWith("/") ? path.substring(1) : path;
        String jdbc = "jdbc:postgresql://" + host + ":" + port + "/" + db;
        String query = uri.getRawQuery();
        if (query != null && !query.isBlank()) {
            jdbc += "?" + query;
        }
        if (System.getenv("RENDER") != null && !jdbc.contains("sslmode=")) {
            jdbc += (jdbc.contains("?") ? "&" : "?") + "sslmode=require";
        }
        System.setProperty("spring.datasource.url", jdbc);
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}
