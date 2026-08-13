package com.example.mapero.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "dia")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_dia")
    private Long id;

    @Column(name = "nombre_dia", nullable = false)
    private String nombre;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "dia_apodos", joinColumns = @JoinColumn(name = "dia_id"))
    @Column(name = "apodo")
    @Builder.Default
    private List<String> apodos = new ArrayList<>();

    @Column(name = "fecha_dia", nullable = false)
    private LocalDate fecha;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "lat", column = @Column(name = "nacimiento_lat")),
            @AttributeOverride(name = "lon", column = @Column(name = "nacimiento_lon")),
            @AttributeOverride(name = "anio", column = @Column(name = "nacimiento_anio"))
    })
    private Punto nacimiento;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "lat", column = @Column(name = "fallecimiento_lat")),
            @AttributeOverride(name = "lon", column = @Column(name = "fallecimiento_lon")),
            @AttributeOverride(name = "anio", column = @Column(name = "fallecimiento_anio"))
    })
    private Punto fallecimiento;
}