package com.example.mapero.dtos.response;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiaResumen {

    private Long id;
    private String nombre;
    private LocalDate fecha;
}