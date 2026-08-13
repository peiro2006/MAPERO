package com.example.mapero.models;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Punto {

    private double lat;
    private double lon;
    private int anio;
}