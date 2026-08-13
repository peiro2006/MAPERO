package com.example.mapero.configs;

import com.example.mapero.models.Dia;
import com.example.mapero.models.Punto;
import com.example.mapero.models.Rol;
import com.example.mapero.repositories.DiaRepository;
import com.example.mapero.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final DiaRepository diaRepository;

    @Override
    public void run(String... args) {
        usuarioRepository.findById(1L).ifPresent(usuario -> {
            if (usuario.getRol() != Rol.ADMIN) {
                usuario.setRol(Rol.ADMIN);
                usuarioRepository.save(usuario);
            }
        });

        if (diaRepository.count() == 0) {
            Dia sanMartin = Dia.builder()
                    .nombre("José de San Martín")
                    .apodos(List.of("san martin", "jose de san martin"))
                    .fecha(LocalDate.of(2026, 8, 12))
                    .nacimiento(new Punto(-27.79, -55.89, 1778))
                    .fallecimiento(new Punto(50.73, 1.59, 1850))
                    .build();
            diaRepository.save(sanMartin);
        }
    }
}