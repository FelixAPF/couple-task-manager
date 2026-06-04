package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.TaskGroup;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class TaskGroupDto {
    private Long id;
    private String name;
    private List<TaskDto> tasks;

    public TaskGroupDto(TaskGroup group) {
        this.id = group.getId();
        this.name = group.getName();
        this.tasks = group.getTasks().stream().map(TaskDto::new).toList();
    }
}