package com.couple.taskmanager.repository;

import java.util.List;

public interface IGenericRepository<T> {
    T get(int id);
    List<T> list();
    T update(int id, T t);
    void delete(int id);
    void create(T t);
}
