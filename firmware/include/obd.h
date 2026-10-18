#pragma once
#include <stdint.h>
#include <stdbool.h>

struct OBDData {
    // ── Parâmetros principais ──────────────────────────────────────
    uint16_t rpm;           // PID 0x0C — RPM
    uint8_t  speed;         // PID 0x0D — km/h
    int8_t   coolant_temp;  // PID 0x05 — temperatura líquido °C
    int8_t   intake_temp;   // PID 0x0F — temperatura ar admissão °C
    uint8_t  throttle;      // PID 0x11 — posição acelerador 0-100 %
    uint8_t  map_kpa;       // PID 0x0B — pressão absoluta intake kPa
    uint8_t  gear;          // calculada via relações de transmissão
    float    voltage;       // PID 0x42 — tensão bateria V

    // ── Sensores expandidos ────────────────────────────────────────
    uint8_t  engine_load;   // PID 0x04 — carga calculada do motor %
    float    maf_gs;        // PID 0x10 — vazão de ar g/s
    int8_t   fuel_trim_st;  // PID 0x06 — correção combustível curto prazo %
    int8_t   fuel_trim_lt;  // PID 0x07 — correção combustível longo prazo %
    int8_t   timing_adv;    // PID 0x0E — avanço de ignição °
    uint8_t  o2_raw;        // PID 0x14 — tensão sonda O2 (× 0.005 V, narrowband)
    int8_t   oil_temp;      // PID 0x5C — temperatura óleo °C (se suportado)
    int8_t   ambient_temp;  // PID 0x46 — temperatura ambiente °C
    uint8_t  fuel_level;    // PID 0x2F — nível combustível %

    // ── Mode 22 VW-específicos ─────────────────────────────────────
    // Precisam de verificação no carro — fallback para Mode 01 se não suportado
    float    boost_target;  // PID22 0x04A2 — turbo alvo kPa relativa
    float    boost_actual;  // PID22 0x04A3 — turbo real kPa relativa
    bool     mode22_ok;     // Mode 22 funcionando neste veículo

    // ── Status do sistema ─────────────────────────────────────────
    bool     tc_disabled;   // TC desligado pelo usuário
    bool     launch_armed;  // launch control armado
    bool     valid;         // dados OBD válidos (ECU respondendo)
};

// Inicializa driver CAN (TWAI)
void obd_init();

// Atualiza struct com ciclo de PIDs (chamar a cada 100 ms)
bool obd_update(OBDData& data);

// Toggle TC — retorna false se TC_CAN_ID ainda não configurado
bool obd_send_tc_toggle(bool enable);

// Comandos UDS via OBD-II (verificar endereços no carro antes de usar)
bool obd_cmd_needle_sweep();            // varredura agulhas — módulo 17
bool obd_cmd_coming_home(bool enable);  // luzes "coming home" — módulo BCM
bool obd_cmd_gauge_sweep();             // sweep todos os gauges — módulo 17
