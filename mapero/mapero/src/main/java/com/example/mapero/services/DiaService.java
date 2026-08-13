package com.example.mapero.services;

import com.example.mapero.configs.exceptions.NotFoundException;
import com.example.mapero.dtos.request.DiaRequest;
import com.example.mapero.dtos.response.DiaResumen;
import com.example.mapero.models.Dia;
import com.example.mapero.repositories.DiaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiaService {

    private final DiaRepository diaRepository;

    public List<DiaResumen> resumenes() {
        return diaRepository.findAll().stream()
                .sorted(Comparator.comparing(Dia::getFecha))
                .map(d -> DiaResumen.builder()
                        .id(d.getId())
                        .nombre(d.getNombre())
                        .fecha(d.getFecha())
                        .build())
                .toList();
    }

    public Dia obtener(Long id) {
        return diaRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No existe el día solicitado"));
    }

    public Dia crear(DiaRequest request) {
        Dia dia = Dia.builder()
                .nombre(request.getNombre())
                .apodos(request.getApodos())
                .fecha(request.getFecha())
                .nacimiento(request.getNacimiento())
                .fallecimiento(request.getFallecimiento())
                .build();
        return diaRepository.save(dia);
    }

    public Dia actualizar(Long id, DiaRequest request) {
        Dia dia = obtener(id);
        dia.setNombre(request.getNombre());
        dia.setApodos(request.getApodos());
        dia.setFecha(request.getFecha());
        dia.setNacimiento(request.getNacimiento());
        dia.setFallecimiento(request.getFallecimiento());
        return diaRepository.save(dia);
    }

    public void eliminar(Long id) {
        Dia dia = obtener(id);
        diaRepository.delete(dia);
    }
}