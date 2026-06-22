package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.ProcedureStep;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ProcedureStepDto {
    private Long id;
    private String description;
    private Integer stepOrder;

    public ProcedureStepDto(ProcedureStep procedureStep){
        this.id = procedureStep.getId();
        this.description = procedureStep.getDescription();
        this.stepOrder = procedureStep.getStepOrder();
    }
}