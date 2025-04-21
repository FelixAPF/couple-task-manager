package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;

public interface IGenericService<T> {

    T get(Long id, CTMUser user) ;
    List<T> list(CTMUser user);
    T update(Long id, T t, CTMUser user);
    void delete(Long id, CTMUser user);
    T create(T t, CTMUser user);

}
