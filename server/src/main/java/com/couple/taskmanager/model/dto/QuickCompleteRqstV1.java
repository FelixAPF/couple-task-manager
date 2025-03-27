package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.enums.CreationMethod;
import com.couple.taskmanager.enums.Frequency;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class QuickCompleteRqstV1 {
    private Long taskId;
    private Assignee assignee;
}
