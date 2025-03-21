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
        String connectionString = "jdbc:sqlserver://couple-task-manager-active.database.windows.net:1433;" +
                "database=couple-task-manager-active;" +
                "user=CloudSA4f7cabff@couple-task-manager-active;" +
                "password={" + password + "};" +
                "encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30;";
        return DataSourceBuilder.create()
                .driverClassName("com.microsoft.sqlserver.jdbc.SQLServerDriver")
                .url(connectionString)
                .build();
    }
}
