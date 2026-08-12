package com.example.mapero.repositories;

import com.example.mapero.models.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Usuario> findAllByOrderByPuntosDescPronosticosAsc();
    List<Usuario> findAllByOrderByPuntosAscPronosticosDesc();
    List<Usuario> findByClanOrderByPuntosDescPronosticosAsc(String clan);
    List<Usuario> findByClanOrderByPuntosAscPronosticosDesc(String clan);
    @Query(value = "SELECT u.* FROM usuario u " +
            "LEFT JOIN pronosticos pr ON pr.usuario_id = u.id " +
            "LEFT JOIN partidos pa ON pa.id_partido = pr.id_partido AND pa.goles_local IS NOT NULL " +
            "GROUP BY u.id " +
            "ORDER BY u.puntos DESC, " +
            "  SUM(CASE WHEN pr.goles_local = pa.goles_local AND pr.goles_visitante = pa.goles_visitante THEN 1 ELSE 0 END) DESC, " +
            "  MIN(pr.fecha_pronostico) ASC", nativeQuery = true)
    List<Usuario> findRankingGlobal();
    @Query(value = "SELECT u.* FROM usuario u " +
            "LEFT JOIN pronosticos pr ON pr.usuario_id = u.id " +
            "LEFT JOIN partidos pa ON pa.id_partido = pr.id_partido AND pa.goles_local IS NOT NULL " +
            "GROUP BY u.id " +
            "ORDER BY u.puntos ASC, " +
            "  SUM(CASE WHEN pr.goles_local = pa.goles_local AND pr.goles_visitante = pa.goles_visitante THEN 1 ELSE 0 END) ASC, " +
            "  MIN(pr.fecha_pronostico) DESC", nativeQuery = true)
    List<Usuario> findRankingGlobalAsc();
    @Query(value = "SELECT u.* FROM usuario u " +
            "LEFT JOIN pronosticos pr ON pr.usuario_id = u.id " +
            "LEFT JOIN partidos pa ON pa.id_partido = pr.id_partido AND pa.goles_local IS NOT NULL " +
            "WHERE u.clan = :clan " +
            "GROUP BY u.id " +
            "ORDER BY u.puntos DESC, " +
            "  SUM(CASE WHEN pr.goles_local = pa.goles_local AND pr.goles_visitante = pa.goles_visitante THEN 1 ELSE 0 END) DESC, " +
            "  MIN(pr.fecha_pronostico) ASC", nativeQuery = true)
    List<Usuario> findRankingByClan(@Param("clan") String clan);
    @Query(value = "SELECT u.* FROM usuario u " +
            "LEFT JOIN pronosticos pr ON pr.usuario_id = u.id " +
            "LEFT JOIN partidos pa ON pa.id_partido = pr.id_partido AND pa.goles_local IS NOT NULL " +
            "WHERE u.clan = :clan " +
            "GROUP BY u.id " +
            "ORDER BY u.puntos ASC, " +
            "  SUM(CASE WHEN pr.goles_local = pa.goles_local AND pr.goles_visitante = pa.goles_visitante THEN 1 ELSE 0 END) ASC, " +
            "  MIN(pr.fecha_pronostico) DESC", nativeQuery = true)
    List<Usuario> findRankingByClanAsc(@Param("clan") String clan);
    @Query("SELECT DISTINCT u.clan FROM Usuario u WHERE u.clan IS NOT NULL")
    List<String> findDistinctClanByClanIsNotNull();
}
