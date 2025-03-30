package com.couple.taskmanager.service;

import com.couple.taskmanager.enums.Assignee;
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
    public TaskList get(Long id) {
        throw new IllegalArgumentException();
    }

    public TaskList get(Assignee assignee) {
        return taskListRepository.findByAssignee(assignee);
    }

    @Override
    public List<TaskList> list() {
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


    @Override
    public TaskList update(Long id, TaskList taskList) {
        return null;
    }

    @Override
    @Transactional
    public void delete(Long id) {
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
    public TaskList create(TaskList taskList) {
        return taskListRepository.save(taskList);
    }

    public void addTasksToExistingList(List<BasicTaskAssignmentRqstV1> taskWithIds){
        Map<String, List<Long>> assigneeTasks = new HashMap<>();
        for(BasicTaskAssignmentRqstV1 rqst : taskWithIds){
            List<Long> value = assigneeTasks.get(rqst.getAssignee().toString());
            if(value == null){
                List<Long> newList = new ArrayList<>();
                newList.add(rqst.getTaskId());
                assigneeTasks.put(rqst.getAssignee().toString(), newList);
            } else {
                value.add(rqst.getTaskId());
            }
        }

        for(String assignee : assigneeTasks.keySet()){
            TaskList existingTasks = taskListRepository.findByAssignee(Assignee.valueOf(assignee));
            if(existingTasks != null){
                List<Task> newTasks = taskRepository.findAllById(assigneeTasks.get(assignee));
                existingTasks.setTasks(newTasks); // Completely replace the existing tasks
                taskListRepository.save(existingTasks);
            }
        }
    }
}
