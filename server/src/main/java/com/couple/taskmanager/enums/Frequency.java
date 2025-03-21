package com.couple.taskmanager.enums;

public enum Frequency {
    DAILY("DAILY"),
    BIWEEKLY("BIWEEKLY"),
    WEEKLY("WEEKLY"),
    MONTHLY("MONTHLY"),
    BIYEARLY("BIYEARLY"),
    YEARLY("YEARLY");

    private final String key;
    private final int daysAmount;

    Frequency(String key){
        this.key = key;
        switch (key){
            case "WEEKLY":
                daysAmount = 7;
                break;
            case "BIWEEKLY":
                daysAmount = 14;
                break;
            case "MONTHLY":
                daysAmount = 30;
                break;
            case "BIYEARLY":
                daysAmount = 182;
                break;
            case "YEARLY":
                daysAmount = 365;
                break;
            case "DAILY":
            default:
                daysAmount = 1;
                break;
        }
    }


    public String getKey() {
        return key;
    }

    public int getDaysAmount() {
        return daysAmount;
    }
}
