package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.FoodIntakeUnitGoal;
import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.model.dto.FoodIntakeUnitGoalDto;
import com.couple.taskmanager.repository.CTMUserRepository;
import com.couple.taskmanager.repository.FoodIntakeUnitGoalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class FoodIntakeUnitGoalService {

    private final FoodIntakeUnitGoalRepository goalRepository;
    private final CTMUserRepository userRepository;
    private final CTMUserService userService;

    public FoodIntakeUnitGoalService(FoodIntakeUnitGoalRepository goalRepository,
                                     CTMUserRepository userRepository,
                                     CTMUserService userService) {
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    /** Resolves the goal that applied on a single date. */
    public FoodIntakeUnitGoalDto getGoalForDate(Long assigneeId, LocalDate date) {
        List<FoodIntakeUnitGoal> versions =
                goalRepository.findByAssigneeIdAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(assigneeId, date);
        return versions.isEmpty() ? defaultGoal(assigneeId) : mapToDto(versions.get(0), date);
    }

    /** Resolves the applicable goal for every day in [startDate, endDate], one query total. */
    public Map<LocalDate, FoodIntakeUnitGoalDto> getGoalsForRange(Long assigneeId, LocalDate startDate, LocalDate endDate) {
        List<FoodIntakeUnitGoal> versions =
                goalRepository.findByAssigneeIdAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(assigneeId, endDate);
        // versions is DESC by effectiveDate; walk the requested days and advance through versions as needed.
        Map<LocalDate, FoodIntakeUnitGoalDto> result = new LinkedHashMap<>();
        int versionIdx = 0;
        for (LocalDate day = startDate; !day.isAfter(endDate); day = day.plusDays(1)) {
            while (versionIdx < versions.size() - 1 && versions.get(versionIdx).getEffectiveDate().isAfter(day)) {
                versionIdx++;
            }
            FoodIntakeUnitGoal applicable = versionIdx < versions.size() ? versions.get(versionIdx) : null;
            result.put(day, applicable != null && !applicable.getEffectiveDate().isAfter(day)
                    ? mapToDto(applicable, day)
                    : defaultGoal(assigneeId));
        }
        return result;
    }

    /** Edits ALWAYS apply from today forward — never touches the past. */
    public FoodIntakeUnitGoalDto upsertTodayGoal(FoodIntakeUnitGoalDto dto) {
        Household household = userService.getCurrentUser().getHousehold();
        CTMUser assignee = userRepository.findById(dto.getAssigneeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignee not found"));

        if (!assignee.getHousehold().getId().equals(household.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to edit this user's goals");
        }

        LocalDate today = LocalDate.now(); // consider household/user timezone if relevant
        FoodIntakeUnitGoal goal = goalRepository.findByAssigneeIdAndEffectiveDate(assignee.getId(), today)
                .orElseGet(() -> {
                    FoodIntakeUnitGoal g = new FoodIntakeUnitGoal();
                    g.setAssignee(assignee);
                    g.setHousehold(household);
                    g.setEffectiveDate(today);
                    return g;
                });

        goal.setProteinTarget(dto.getProteinTarget());
        goal.setVegetableTarget(dto.getVegetableTarget());
        goal.setCarbohydrateTarget(dto.getCarbohydrateTarget());
        goal.setFatTarget(dto.getFatTarget());

        return mapToDto(goalRepository.save(goal), today);
    }

    private FoodIntakeUnitGoalDto defaultGoal(Long assigneeId) {
        FoodIntakeUnitGoalDto dto = new FoodIntakeUnitGoalDto();
        dto.setAssigneeId(assigneeId);
        dto.setProteinTarget(0.0);
        dto.setVegetableTarget(0.0);
        dto.setCarbohydrateTarget(0.0);
        dto.setFatTarget(0.0);
        return dto;
    }

    private FoodIntakeUnitGoalDto mapToDto(FoodIntakeUnitGoal entity, LocalDate forDate) {
        FoodIntakeUnitGoalDto dto = new FoodIntakeUnitGoalDto();
        dto.setId(entity.getId());
        dto.setAssigneeId(entity.getAssignee().getId());
        dto.setDate(forDate);
        dto.setProteinTarget(entity.getProteinTarget());
        dto.setVegetableTarget(entity.getVegetableTarget());
        dto.setCarbohydrateTarget(entity.getCarbohydrateTarget());
        dto.setFatTarget(entity.getFatTarget());
        return dto;
    }
}