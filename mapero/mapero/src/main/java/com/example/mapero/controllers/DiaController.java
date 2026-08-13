package com.example.mapero.controllers;

import com.example.mapero.dtos.response.DiaResumen;
import com.example.mapero.dtos.response.IndiceDias;
import com.example.mapero.models.Dia;
import com.example.mapero.services.DiaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dias")
@RequiredArgsConstructor
public class DiaController {

    private final DiaService diaService;

    @GetMapping
    public IndiceDias indice() {
        return IndiceDias.builder().dias(diaService.resumenes()).build();
    }

    @GetMapping("/{id}")
    public Dia obtener(@PathVariable Long id) {
        return diaService.obtener(id);
    }
}