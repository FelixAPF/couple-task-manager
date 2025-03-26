package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.enums.CreationMethod;
import com.couple.taskmanager.enums.Frequency;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class PeriodCreationRqstV1 {
    private Long periodId;
    private Frequency duration;
    private Date startDate;
    private Date explicitDueDate;
    private CreationMethod creationMethod;
    private List<BasicTaskAssignmentRqstV1> taskAssignmentRqst;
    private Boolean createEachTaskOnce = false;
}
