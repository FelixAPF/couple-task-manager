package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.service.TaskService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/task")
@CrossOrigin("*")
public class TaskController extends GenericController<Task, TaskService> {

}
