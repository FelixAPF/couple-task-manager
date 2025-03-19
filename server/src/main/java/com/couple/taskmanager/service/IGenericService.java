package com.couple.taskmanager.service;

import java.util.List;

public interface IGenericService<T> {

    T get(Long id) ;
    List<T> list();
    T update(Long id, T t);
    void delete(Long id);
    void create(T t);
}
