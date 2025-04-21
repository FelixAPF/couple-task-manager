package com.couple.taskmanager.service;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.TaskList;
import com.couple.taskmanager.model.dto.BasicTaskAssignmentRqstV1;
import com.couple.taskmanager.model.dto.TaskListRequestV1;
import com.couple.taskmanager.repository.TaskListRepository;
import com.couple.taskmanager.repository.TaskRepository;
import com.couple.taskmanager.utils.StreamUtils;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class TaskListService implements IGenericService<TaskList> {
    @Autowired
    TaskListRepository taskListRepository;
    @Autowired
    TaskRepository taskRepository;


    @Override
    public TaskList get(Long id, CTMUser user) {
        throw new IllegalArgumentException();
    }

    public List<TaskList> get(Assignee assignee) {
        List<TaskList> taskLists = new ArrayList<>();
        taskLists.add(taskListRepository.findByAssignee(assignee));
        taskLists.add(taskListRepository.findByAssignee(Assignee.Deux));
        return taskLists;
    }

    @Override
    public List<TaskList> list(CTMUser user) {
        return taskListRepository.findAll();
    }

    @PostConstruct
    public void init(){
        for (Assignee assignee : Assignee.values()) {
            if(taskListRepository.findByAssignee(assignee) == null){
                TaskList taskList = new TaskList(new ArrayList<>(), assignee);
                taskListRepository.save(taskList);
            }
        }
    }

    public List<TaskList> listWithUnassigned(){
        List<TaskList> taskLists = taskListRepository.findAll();
        List<Task> tasks = taskRepository.findAll();
        TaskList unassignedTaskList = new TaskList();
        List<Long> assignedTaskIds = StreamUtils.ofNullable(taskLists)
                .flatMap(taskList -> StreamUtils.ofNullable(taskList.getTasks()).map(Task::getId))
                .toList();
        for(Task task : tasks){
            if(!assignedTaskIds.contains(task.getId())){
                unassignedTaskList.getTasks().add(task);
            }
        }
        taskLists.add(unassignedTaskList);
        return taskLists;
    }

    @Transactional // Add this annotation for atomicity
    public void moveTaskToNewAssignee(Long taskId, Assignee newAssignee){
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NoSuchElementException("No task with id " + taskId));

        TaskList sourceList = taskListRepository.findByTaskId(taskId);

        TaskList targetList = taskListRepository.findByAssignee(newAssignee);
        if(targetList == null) {
            throw new IllegalStateException("Target TaskList for assignee " + newAssignee + " not found.");
        }

        if (sourceList != null && sourceList.getId().equals(targetList.getId())) {
            System.out.println("Task " + taskId + " is already assigned to " + newAssignee);
            return; // No changes needed
        }

        List<TaskList> listsToSave = new ArrayList<>();

        if(sourceList != null) {
            boolean removed = sourceList.getTasks().remove(task);
            if (removed) {
                listsToSave.add(sourceList);
            } else {
                System.err.println("Warning: Task " + taskId + " found in list " + sourceList.getId() + " via query, but not in its loaded tasks collection.");
            }
        }

        if (!targetList.getTasks().contains(task)) {
            targetList.getTasks().add(task);
            // Add targetList to save list *only if* it wasn't already added as the sourceList
            if (!listsToSave.contains(targetList)) {
                listsToSave.add(targetList);
            }
        }

        if (!listsToSave.isEmpty()) {
            taskListRepository.saveAll(listsToSave); // Save all modified lists together
        }
    }


    @Override
    public TaskList update(Long id, TaskList taskList, CTMUser user) {
        return null;
    }

    @Override
    @Transactional
    public void delete(Long id, CTMUser user) {
        taskListRepository.deleteById(id);
    }

    @Transactional
    public TaskList unassign(TaskListRequestV1 rqst) {
        TaskList taskList = taskListRepository.findById(rqst.getTaskListId()).orElseThrow(() -> new NoSuchElementException("Task List does not exist " + rqst.getTaskListId()));

        List<Task> tasks = StreamUtils.ofNullable(taskList.getTasks())
                .filter(task -> !task.getId().equals(rqst.getTaskId()))
                .toList();

        taskList.setTasks(new ArrayList<>(tasks));
        return taskListRepository.save(taskList);
    }

    @Override
    public TaskList create(TaskList taskList, CTMUser user) {
        return taskListRepository.save(taskList);
    }

    public void addTasksToExistingList(List<BasicTaskAssignmentRqstV1> taskWithIds){
        Map<String, List<Long>> assigneeTasks = new HashMap<>();
        for(Assignee assignee : Assignee.values()){
            assigneeTasks.put(assignee.toString(), new ArrayList<>());
        }
        for(BasicTaskAssignmentRqstV1 rqst : taskWithIds){
            List<Long> value = assigneeTasks.get(rqst.getAssignee().toString());
            if(value != null){
                value.add(rqst.getTaskId());
            }
        }

        List<TaskList> toUpdateTaskLists = new ArrayList<>();
        for(String assignee : assigneeTasks.keySet()){
            TaskList existingTaskList = taskListRepository.findByAssignee(Assignee.valueOf(assignee));
            if(existingTaskList == null) continue;
            List<Task> newTasks = taskRepository.findAllById(assigneeTasks.get(assignee));
            existingTaskList.setTasks(newTasks); // Completely replace the existing tasks
            toUpdateTaskLists.add(existingTaskList);
        }
        taskListRepository.saveAllAndFlush(toUpdateTaskLists);
    }
}
