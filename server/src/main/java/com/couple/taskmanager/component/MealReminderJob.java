package com.couple.taskmanager.component;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Meal;
import com.couple.taskmanager.repository.MealRepository;
import com.couple.taskmanager.repository.NotificationRepository;
import com.couple.taskmanager.service.FirebaseMessagingService;
import com.couple.taskmanager.utils.DateUtils;
import com.couple.taskmanager.utils.StreamUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Calendar;
import java.util.Date;
import java.util.List;

@Component
public class MealReminderJob {

    @Autowired
    private MealRepository mealRepository;
    @Autowired
    private FirebaseMessagingService firebaseMessagingService;

    @Scheduled(cron = "0 0 16 * * *", zone = "America/Toronto")
    public void remindChefCookingTonight() {
        Calendar cal = Calendar.getInstance();
        Date todayStart = DateUtils.getStartOfDay(cal.getTime());
        Date todayEnd = DateUtils.getEndOfDay(cal.getTime());

        List<Meal> byDateBetweenAndIsThawingNeededTrue = mealRepository.findByDateBetweenAndIsThawingNeededTrue(todayStart, todayEnd);
        StreamUtils.ofNullable(byDateBetweenAndIsThawingNeededTrue)
                .filter(meal -> meal.getAssignedUser() != null)
                .forEach(meal -> {
                    String recipeName = meal.getRecipe() != null ? meal.getRecipe().getName() : "Unknown Meal";
                    String title = "Rappel - Chef de ce soir";
                    String message = "Repas: " + recipeName;

                    CTMUser chef = meal.getAssignedUser();
                    firebaseMessagingService.sendNotificationWithNavigation(chef, title, message, "MEAL", meal.getId());
                });
    }

}
