package com.couple.taskmanager.utils;

import com.couple.taskmanager.enums.Frequency;
import lombok.experimental.UtilityClass;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

@UtilityClass
public class DateUtils {
    private static final Logger log = LoggerFactory.getLogger(DateUtils.class);

    public static Date calculateDueDate(Date startDate, Frequency frequency) {
        if (startDate == null || frequency == null) {
            log.warn("Cannot calculate next due date with null start date or frequency.");
            throw new IllegalArgumentException("Start date and frequency cannot be null.");
        }
        if (frequency.getDaysAmount() <= 0){
            log.warn("Cannot calculate next due date with non positive frequency.");
            throw new IllegalArgumentException("frequency must be above 0");
        }

        Calendar calendar = Calendar.getInstance();
        calendar.setTime(startDate);
        calendar.add(Calendar.DAY_OF_MONTH, frequency.getDaysAmount());

        return calendar.getTime();
    }

    public static Date calculateDueDate(Date startDate, Integer duration) {
        if (startDate == null || duration == null) {
            log.warn("Cannot calculate due date with null start date or duration.");
            throw new IllegalArgumentException("Start date and duration cannot be null.");
        }

        Calendar calendar = Calendar.getInstance();
        calendar.setTime(startDate);
        calendar.add(Calendar.DAY_OF_MONTH, duration);

        return calendar.getTime();
    }

    public static long calculateDaysBetween(Date startDate, Date endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and end date cannot be null.");
        }

        LocalDate startLocalDate = startDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        LocalDate endLocalDate = endDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();

        return ChronoUnit.DAYS.between(startLocalDate, endLocalDate);
    }

    public static Date calculateEndDate(Date startDate, Date explicitDate) {
        if (startDate == null || explicitDate == null) {
            log.warn("Cannot calculate due date with null start date or explicitDate.");
            throw new IllegalArgumentException("Start date and explicitDate cannot be null.");
        }
        if (explicitDate.before(startDate)) {
            log.warn("Cannot calculate due date with explicit date before start date.");
            throw new IllegalArgumentException("Explicit date cannot be before start date");
        }

        return explicitDate;
    }

    public static Date addMonthsToDate(Date date, int monthsToAdd) {
        if (date == null) {
            log.warn("Cannot add months to a null date.");
            throw new IllegalArgumentException("Date cannot be null.");
        }
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        calendar.add(Calendar.MONTH, monthsToAdd);
        return calendar.getTime();
    }

    public static Date getStartOfDay(Date date) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        return calendar.getTime();
    }

    public static Date getEndOfDay(Date date) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        calendar.set(Calendar.HOUR_OF_DAY, 23);
        calendar.set(Calendar.MINUTE, 59);
        calendar.set(Calendar.SECOND, 59);
        calendar.set(Calendar.MILLISECOND, 999);
        return calendar.getTime();
    }
}
