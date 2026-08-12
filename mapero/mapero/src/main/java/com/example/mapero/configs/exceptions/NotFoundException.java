package com.example.mapero.configs.exceptions;

import org.springframework.http.HttpStatus;

import java.util.List;

public class NotFoundException extends CustomException {

    public NotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, List.of(message));
    }

    public NotFoundException(String message, HttpStatus status, List<String> errors) {
        super(message, status, errors);
    }
}