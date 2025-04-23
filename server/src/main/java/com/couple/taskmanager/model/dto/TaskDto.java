package com.couple.taskmanager.model.dto;
import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.enums.Room;
import com.couple.taskmanager.model.Task;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskDto {
    private Long id;
    private String title;
    private String description;
    private Frequency frequency;
    private Room room;

    public TaskDto(Task task) {
        this.id = task.getId();
        this.title = task.getTitle();
        this.description = task.getDescription();
        this.frequency = task.getFrequency();
        this.room = task.getRoom();
    }

}
