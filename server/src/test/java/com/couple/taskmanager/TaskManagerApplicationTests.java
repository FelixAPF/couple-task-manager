package com.couple.taskmanager;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
class TaskManagerApplicationTests {

	@DynamicPropertySource
	static void registerProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", () -> System.getenv("DATABASE_URL"));
		registry.add("spring.datasource.username", () -> System.getenv("DATABASE_USERNAME"));
		registry.add("spring.datasource.password", () -> System.getenv("DATABASE_PASSWORD"));
	}

	@Test
	void contextLoads() {
	}
}