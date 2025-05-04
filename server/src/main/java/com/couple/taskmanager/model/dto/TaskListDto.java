package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.TaskList;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskListDto {
    private Long id;
    private HouseholdMemberDto assignee;
    private List<TaskDto> tasks;

    public TaskListDto(TaskList taskList) {
        this.id = taskList.getId();
        CTMUser user = taskList.getUser();
        if (user != null) {
            this.assignee = new HouseholdMemberDto(user.getId(), user.getName(), user.getEmail(), user.getImageUrl(), user.getBirthDay(), taskList.getUser().getAuthorities().stream().map(GrantedAuthority::getAuthority).toList());
        }
        this.tasks = taskList.getTasks().stream().map(TaskDto::new).toList();
    }
}
