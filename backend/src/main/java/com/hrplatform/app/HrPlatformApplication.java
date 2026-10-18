package com.hrplatform.app;

import com.hrplatform.app.config.DatabaseUrlParser;
import com.hrplatform.app.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class)
public class HrPlatformApplication {

	public static void main(String[] args) {
		DatabaseUrlParser.applyFromEnvironment();
		SpringApplication.run(HrPlatformApplication.class, args);
	}

}
