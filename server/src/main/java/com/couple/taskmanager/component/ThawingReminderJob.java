package com.couple.taskmanager.component;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Meal;
import com.couple.taskmanager.repository.MealRepository;
import com.couple.taskmanager.service.FirebaseMessagingService;
import com.couple.taskmanager.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Calendar;
import java.util.Date;
import java.util.List;

@Component
public class ThawingReminderJob {

    @Autowired
    private MealRepository mealRepository;
    @Autowired
    private FirebaseMessagingService notificationService;

    // Runs every day at 7 PM server time
    @Scheduled(cron = "0 0 19 * * *", zone = "America/Toronto")
    public void checkThawingNeeded() {
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DAY_OF_YEAR, 1);
        Date tomorrowStart = DateUtils.getStartOfDay(cal.getTime());
        Date tomorrowEnd = DateUtils.getEndOfDay(cal.getTime());

        List<Meal> meals = mealRepository.findByDateBetweenAndIsThawingNeededTrue(tomorrowStart, tomorrowEnd);

        for (Meal meal : meals) {
            String recipeName = meal.getRecipe() != null ? meal.getRecipe().getName() : "Unknown Meal";
            String title = "Décongélation requise ❄️";
            String message = "Pour demain: " + recipeName;

            if (meal.getAssignedUser() != null) {
                // Notify Assignee with "MEAL" type navigation
                notificationService.sendNotificationWithNavigation(
                        meal.getAssignedUser(),
                        title,
                        message,
                        "MEAL",
                        meal.getId()
                );
            } else {
                // Notify Household
                List<CTMUser> users = meal.getHousehold().getUsers();
                if (users != null) {
                    for (CTMUser user : users) {
                        notificationService.sendNotificationWithNavigation(
                                user,
                                title,
                                message,
                                "MEAL",
                                meal.getId()
                        );
                    }
                }
            }
        }
    }
}