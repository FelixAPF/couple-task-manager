package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.model.Procedure;
import com.couple.taskmanager.model.ProcedureStep;
import com.couple.taskmanager.model.dto.HouseholdDto;
import com.couple.taskmanager.model.dto.ProcedureDto;
import com.couple.taskmanager.model.dto.ProcedureStepDto;
import com.couple.taskmanager.repository.ProcedureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProcedureService {

    private final ProcedureRepository procedureRepository;
    private final HouseholdService householdService;

    public List<ProcedureDto> getProceduresForCurrentHousehold() {
        return procedureRepository.findAllByHouseholdId(householdService.getCurrentHousehold().getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProcedureDto createProcedure(ProcedureDto dto) {
        Household household = householdService.getCurrentHousehold();
        Procedure procedure = new Procedure();
        procedure.setName(dto.getName());
        procedure.setHousehold(household);

        if (dto.getSteps() != null) {
            for (ProcedureStepDto stepDto : dto.getSteps()) {
                ProcedureStep step = new ProcedureStep();
                step.setDescription(stepDto.getDescription());
                step.setStepOrder(stepDto.getStepOrder());
                step.setProcedure(procedure);
                procedure.getSteps().add(step);
            }
        }

        Procedure saved = procedureRepository.save(procedure);
        return mapToDto(saved);
    }

    @Transactional
    public ProcedureDto updateProcedure(Long id, ProcedureDto dto) {
        Procedure procedure = procedureRepository.findById(id).orElseThrow();
        procedure.setName(dto.getName());

        procedure.getSteps().clear();
        if (dto.getSteps() != null) {
            for (ProcedureStepDto stepDto : dto.getSteps()) {
                ProcedureStep step = new ProcedureStep();
                step.setDescription(stepDto.getDescription());
                step.setStepOrder(stepDto.getStepOrder());
                step.setProcedure(procedure);
                procedure.getSteps().add(step);
            }
        }

        Procedure saved = procedureRepository.save(procedure);
        return mapToDto(saved);
    }

    public void deleteProcedure(Long id) {
        procedureRepository.deleteById(id);
    }

    public ProcedureDto mapToDto(Procedure procedure) {
        if (procedure == null) return null;

        return new ProcedureDto(procedure);
    }
}