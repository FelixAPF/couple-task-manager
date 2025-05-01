package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.Item;
import com.couple.taskmanager.model.WayToCare;
import com.couple.taskmanager.model.dto.ItemDto;
import com.couple.taskmanager.model.dto.WayToCareDto;
import com.couple.taskmanager.service.ItemService;
import com.couple.taskmanager.service.WayToCareService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/wish-list")
public class WishListController extends GenericController<Item, ItemDto, ItemService> {


}
