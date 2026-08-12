package com.example.mapero.configs.exceptions;

import org.springframework.http.HttpStatus;

import java.util.List;

public class ConflictException extends CustomException {

    public ConflictException(String message) {
        super(message, HttpStatus.CONFLICT, List.of(message));
    }

    public ConflictException(String message, List<String> errors) {
        super(message, HttpStatus.CONFLICT, errors);
    }
}
