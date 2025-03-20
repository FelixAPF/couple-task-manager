package com.couple.taskmanager.utils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Stream;

public class StreamUtils{
    public static <T> Stream<T> ofNullable(Collection<T> t){
        return t == null ? Stream.empty() : t.stream();
    }
}
