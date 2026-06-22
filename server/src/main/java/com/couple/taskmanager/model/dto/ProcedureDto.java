package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.Procedure;
import com.couple.taskmanager.utils.StreamUtils;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class ProcedureDto {
    private Long id;
    private String name;
    private List<ProcedureStepDto> steps;

    public ProcedureDto(Procedure procedure){
        this.id = procedure.getId();
        this.name = procedure.getName();
        if(procedure.getSteps() != null) {
            this.steps = StreamUtils.mapToList(procedure.getSteps(), ProcedureStepDto::new);
        }
    }
}