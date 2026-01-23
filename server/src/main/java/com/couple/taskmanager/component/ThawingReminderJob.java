package com.couple.taskmanager.component;

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

    // Runs every day at 8 PM server time
    @Scheduled(cron = "0 50 17 * * *", zone = "America/Toronto")
    public void checkThawingNeeded() {
        // Calculate "Tomorrow"
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DAY_OF_YEAR, 1);
        Date tomorrowStart = DateUtils.getStartOfDay(cal.getTime());
        Date tomorrowEnd = DateUtils.getEndOfDay(cal.getTime());

        // You likely need a custom query in MealRepository for this:
        // List<Meal> findByDateBetweenAndIsThawingNeededTrue(Date start, Date end);
        List<Meal> meals = mealRepository.findByDateBetweenAndIsThawingNeededTrue(tomorrowStart, tomorrowEnd);

        for (Meal meal : meals) {
            String recipeName = meal.getRecipe() != null ? meal.getRecipe().getName() : "Unknown Meal";
            String message = "N'oubliez pas de décongeler les ingrédients pour: " + recipeName;

            if (meal.getAssignedUser() != null) {
                // Notify Assignee
                notificationService.sendNotificationToUser(meal.getAssignedUser(), "Décongélation nourriture", message);
            } else {
                // Notify Household
                notificationService.sendNotificationToUsers(meal.getHousehold().getUsers(), "Décongélation nourriture", message);
            }
        }
    }
}