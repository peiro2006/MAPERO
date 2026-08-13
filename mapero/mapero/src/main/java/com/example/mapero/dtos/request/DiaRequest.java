package com.example.mapero.dtos.request;

import com.example.mapero.models.Punto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiaRequest {

    @NotBlank(message = "Debe ingresar el nombre de la figura")
    private String nombre;

    @NotNull(message = "Debe ingresar al menos una respuesta posible")
    private List<String> apodos;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    @NotNull(message = "El nacimiento es obligatorio")
    private Punto nacimiento;

    @NotNull(message = "El fallecimiento es obligatorio")
    private Punto fallecimiento;
}