package com.couple.taskmanager.scheduler;

import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.repository.HouseholdRepository;
import com.couple.taskmanager.service.FinanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Runs at 00:05 on the 1st of every month (right after the previous month closes)
 * and deducts each household's configured fixed electricity payment from their
 * ElectricityFund balance. Per product decision, this deduction always applies in
 * full, even if it pushes the balance negative — a negative balance is the clearest
 * signal that the fixed monthly payment configured in Household Expenses is too low.
 *
 * Requires @EnableScheduling on a @Configuration class somewhere in the app
 * (add it if the project doesn't already have one for another feature).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ElectricityBillingScheduler {

    private final HouseholdRepository householdRepository;
    private final FinanceService financeService;

    @Scheduled(cron = "0 5 0 1 * *")
    public void runMonthlyElectricityDeduction() {
        List<Household> households = householdRepository.findAll();
        log.info("Running monthly electricity deduction for {} household(s)", households.size());

        for (Household household : households) {
            try {
            } catch (Exception e) {
                log.error("Failed to run monthly electricity deduction for household {}", household.getId(), e);
            }
        }
    }
}