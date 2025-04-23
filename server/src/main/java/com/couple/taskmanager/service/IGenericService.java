package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.dto.TaskDto;

import java.util.List;

public interface IGenericService<T, D> {

    D get(Long id, Long householdId, CTMUser user) ;
    List<D> list(Long householdId, CTMUser user);
    D update(Long id, T t, CTMUser user);

    void delete(Long id, Long householdId, CTMUser user);
    D create(T t, CTMUser user);

}
