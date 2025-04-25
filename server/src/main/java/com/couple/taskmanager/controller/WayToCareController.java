package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.WayToCare;
import com.couple.taskmanager.model.dto.WayToCareDto;
import com.couple.taskmanager.service.WayToCareService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ways-to-care")
public class WayToCareController extends GenericController<WayToCare, WayToCareDto, WayToCareService> {


}
