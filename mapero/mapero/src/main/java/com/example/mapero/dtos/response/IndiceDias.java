package com.example.mapero.dtos.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class IndiceDias {
    private final List<DiaResumen> dias;
}
