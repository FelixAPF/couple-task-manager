package com.couple.taskmanager;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {
    @Autowired
    private Environment environment;

    @Bean
    public DataSource dataSource() {
        String password = environment.getProperty("DATABASE_PASSWORD");
        String connectionString = environment.getProperty("DATABASE_URL");
        String username = environment.getProperty("DATABASE_USERNAME");
        return DataSourceBuilder.create()
                .driverClassName("com.microsoft.sqlserver.jdbc.SQLServerDriver")
                .url(connectionString)
                .username(username)
                .password(password)
                .build();
    }
}
