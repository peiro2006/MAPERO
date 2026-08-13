package com.example.mapero.controllers;

import com.example.mapero.dtos.request.DiaRequest;
import com.example.mapero.models.Dia;
import com.example.mapero.services.DiaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/dias")
@RequiredArgsConstructor
public class AdminDiaController {

    private final DiaService diaService;

    @PostMapping
    public ResponseEntity<Dia> crear(@RequestBody @Valid DiaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(diaService.crear(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Dia> actualizar(@PathVariable Long id, @RequestBody @Valid DiaRequest request) {
        return ResponseEntity.ok(diaService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        diaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}