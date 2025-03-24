package com.couple.taskmanager.utils;

import com.couple.taskmanager.enums.Frequency;
import lombok.experimental.UtilityClass;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@UtilityClass
public class DateUtils {
    public static Date stringToDate(String dateString, String pattern) {
        SimpleDateFormat dateFormat = new SimpleDateFormat(pattern);
        try {
            return dateFormat.parse(dateString);
        } catch (ParseException e) {
            System.err.println("Error parsing date: " + e.getMessage());
            return null; // Or throw an exception
        }
    }

    public static Date calculateDueDate(Date startDate, Frequency frequency){
        Date date = new Date(startDate.getTime());
        int daysAmount = frequency.getDaysAmount();
        long time = (long) daysAmount * 24 * 60 * 60 * 1000;
        date.setTime(date.getTime() + time);
        return date;
    }


}
