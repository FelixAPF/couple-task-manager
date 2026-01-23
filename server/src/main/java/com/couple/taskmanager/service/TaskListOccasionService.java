package com.couple.taskmanager.service;

import com.couple.taskmanager.model.*;
import com.couple.taskmanager.model.dto.TaskListOccasionDto;
import com.couple.taskmanager.repository.*;
import com.couple.taskmanager.utils.StreamUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class TaskListOccasionService implements IGenericService<TaskListOccasion, TaskListOccasionDto> {
    @Autowired
    TaskListOccasionRepository repository;
    @Autowired
    CTMUserRepository userRepository;
    @Autowired
    TaskAssignmentRepository taskAssignmentRepository;
    @Autowired
    TaskRepository taskRepository;
    @Autowired
    HouseholdRepository householdRepository;

    @Override
    public TaskListOccasionDto get(Long id, Long householdId, CTMUser user) {
        TaskListOccasion byId = repository.findById(id).orElseThrow(NoSuchElementException::new);
        if(!householdId.equals(byId.getHousehold().getId())){
            throw new AccessDeniedException("User is not part of the right household");
        }
        return new TaskListOccasionDto(byId);
    }

    @Override
    public List<TaskListOccasionDto> list(Long householdId, CTMUser user) {
        List<TaskListOccasion> allByHouseholdId = repository.findAllByHouseholdId(householdId);
        return StreamUtils.mapToList(allByHouseholdId, TaskListOccasionDto::new);
    }

    public void createAndAddTaskAssignment(Long taskListOccasionId, Long taskId, Long assigneeId, CTMUser user){
        TaskListOccasion taskListOccasion = repository.findById(taskListOccasionId).orElseThrow(NoSuchElementException::new);
        CTMUser assignee = userRepository.findById(assigneeId).orElseThrow(NoSuchElementException::new);
        if(!assignee.getHousehold().getId().equals(user.getHousehold().getId())){
            throw new AccessDeniedException("User is not part of the right household");
        }
        TaskAssign taskAssign = new TaskAssign();
        Task task = taskRepository.findById(taskId).orElseThrow(IllegalArgumentException::new);
        Household household = householdRepository.findById(user.getHousehold().getId()).orElseThrow(IllegalArgumentException::new);
        if(!user.getHousehold().getId().equals(household.getId())){
            throw new AccessDeniedException("User is not part of the right household");
        }

        taskAssign.setTask(task);
        taskAssign.setAssignee(assignee);

        taskAssign.setTaskListOccasion(taskListOccasion);

        taskListOccasion.getTaskAssignments().add(taskAssign);
        repository.save(taskListOccasion);
    }

    @Override
    public TaskListOccasionDto update(Long id, TaskListOccasion taskListOccasion, CTMUser user) {
        return null;
    }

    @Override
    public void delete(Long id, Long householdId, CTMUser user) {
        if(!user.getHousehold().getId().equals(householdId)){
            throw new AccessDeniedException("User is not part of the right household");
        }
        repository.deleteById(id);
    }

    @Override
    public TaskListOccasionDto create(TaskListOccasion taskListOccasion, CTMUser user) {
        Household household = householdRepository.findById(user.getHousehold().getId()).orElseThrow(IllegalArgumentException::new);
        taskListOccasion.setId(null);
        taskListOccasion.setHousehold(household);

        if(taskListOccasion.getName() == null || taskListOccasion.getName().isEmpty()){
            taskListOccasion.setTaskAssignments(new ArrayList<>());
        }
        return new TaskListOccasionDto(repository.save(taskListOccasion));
    }

    public void unassignTaskFromUser(Long taskListOccasionId, Long taskId, Long assigneeId, CTMUser userDetails) {
        TaskListOccasion occasion = repository.findById(taskListOccasionId)
                .orElseThrow(NoSuchElementException::new);

        if (!userDetails.getHousehold().getId().equals(occasion.getHousehold().getId())) {
            throw new AccessDeniedException("User is not part of the right household");
        }

        // Use an Iterator or removeIf, but ensure we break the bidirectional reference
        boolean removed = occasion.getTaskAssignments().removeIf(ta -> {
            if (ta.getTask().getId().equals(taskId) && ta.getAssignee().getId().equals(assigneeId)) {
                ta.setTaskListOccasion(null); // Break the link to the parent
                return true;
            }
            return false;
        });

        if (removed) {
            repository.save(occasion);
        }
    }
}
