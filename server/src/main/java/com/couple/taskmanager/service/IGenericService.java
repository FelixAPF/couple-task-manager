package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;

import java.util.List;

public interface IGenericService<T> {

    T get(Long id, Long householdId, CTMUser user) ;
    List<T> list(Long householdId, CTMUser user);
    T update(Long id, T t, CTMUser user);
    void delete(Long id, Long householdId, CTMUser user);
    T create(T t, CTMUser user);

}
