#include "obd.h"
#include "config.h"
#include <Arduino.h>
#include <driver/twai.h>

// ── Razões das marchas do Up TSI 1.0 (ASG 5-vel) ──────────────────
static const float GEAR_RATIO[GEAR_RATIOS_N] = {
    3.455f, 1.944f, 1.370f, 1.029f, 0.820f, 0.673f
};
static const float FINAL_DRIVE  = 3.941f;
static const float TIRE_CIRC_M  = 1.82f;  // pneu 175/65 R14

// ═══════════════════════════════════════════════════════════════════
//  Camada CAN / ISO-TP primitives
// ═══════════════════════════════════════════════════════════════════

static bool can_send_obd(uint8_t mode, uint8_t pid, uint8_t* resp, uint8_t& len) {
    twai_message_t tx = {};
    tx.identifier       = OBD_REQUEST_ID;
    tx.data_length_code = 8;
    tx.data[0] = 0x02;
    tx.data[1] = mode;
    tx.data[2] = pid;
    // SAE J1979 padding
    for (int i = 3; i < 8; i++) tx.data[i] = 0x55;

    if (twai_transmit(&tx, pdMS_TO_TICKS(50)) != ESP_OK) return false;

    twai_message_t rx = {};
    uint32_t deadline = millis() + OBD_TIMEOUT_MS;
    while (millis() < deadline) {
        if (twai_receive(&rx, pdMS_TO_TICKS(10)) == ESP_OK) {
            // filtra resposta positiva: ID 0x7E8-0x7EF, byte1 = mode+0x40, byte2 = pid
            if (rx.identifier >= OBD_RESPONSE_ID &&
                rx.identifier <= (OBD_RESPONSE_ID + 7) &&
                rx.data[1] == (mode + 0x40) && rx.data[2] == pid) {
                len = rx.data[0] - 2;
                for (uint8_t i = 0; i < len && i < 4; i++) resp[i] = rx.data[3 + i];
                return true;
            }
        }
    }
    return false;
}

// Mode 22 = UDS ReadDataByIdentifier (fabricante VW)
static bool can_send_mode22(uint16_t did, uint8_t* resp, uint8_t& len) {
    twai_message_t tx = {};
    tx.identifier       = OBD_REQUEST_ID;
    tx.data_length_code = 8;
    tx.data[0] = 0x03;               // length: service + 2-byte DID
    tx.data[1] = 0x22;               // UDS ReadDataByIdentifier
    tx.data[2] = (did >> 8) & 0xFF;
    tx.data[3] = did & 0xFF;
    for (int i = 4; i < 8; i++) tx.data[i] = 0xCC;

    if (twai_transmit(&tx, pdMS_TO_TICKS(50)) != ESP_OK) return false;

    twai_message_t rx = {};
    uint32_t deadline = millis() + OBD_TIMEOUT_MS;
    while (millis() < deadline) {
        if (twai_receive(&rx, pdMS_TO_TICKS(10)) == ESP_OK) {
            if (rx.identifier >= OBD_RESPONSE_ID &&
                rx.identifier <= (OBD_RESPONSE_ID + 7) &&
                rx.data[1] == 0x62 &&             // positive response 0x22+0x40
                rx.data[2] == ((did >> 8) & 0xFF) &&
                rx.data[3] == (did & 0xFF)) {
                len = rx.data[0] - 3;
                for (uint8_t i = 0; i < len && i < 4; i++) resp[i] = rx.data[4 + i];
                return true;
            }
        }
    }
    return false;
}

// Envia frame UDS single-frame para endereço físico de um módulo.
// Não gerencia multi-frame — comandos curtos de output test cabem em 7 bytes.
static bool uds_send_cmd(uint16_t addr, const uint8_t* payload, uint8_t plen) {
    if (plen > 7) return false;   // single-frame UDS max 7 bytes data
    twai_message_t tx = {};
    tx.identifier       = addr;
    tx.data_length_code = 8;
    tx.data[0] = plen;            // SF_DL
    for (uint8_t i = 0; i < plen; i++) tx.data[1 + i] = payload[i];
    for (uint8_t i = plen + 1; i < 8; i++) tx.data[i] = 0xCC;

    if (twai_transmit(&tx, pdMS_TO_TICKS(100)) != ESP_OK) return false;

    // aguarda ACK positivo ou timeout
    twai_message_t rx = {};
    uint32_t deadline = millis() + 200;
    while (millis() < deadline) {
        if (twai_receive(&rx, pdMS_TO_TICKS(15)) == ESP_OK) {
            uint16_t resp_addr = addr + (UDS_ADDR_ENGINE == addr ? 8 : 8);
            if (rx.identifier == (addr + 8)) {
                // verifica que não é resposta negativa (0x7F)
                return (rx.data[1] != 0x7F);
            }
        }
    }
    return false;
}

// ═══════════════════════════════════════════════════════════════════
//  Cálculo de marcha
// ═══════════════════════════════════════════════════════════════════

static uint8_t calc_gear(uint16_t rpm, uint8_t speed_kmh) {
    if (rpm < 300 || speed_kmh < 5) return 0;
    float wheel_rps  = (speed_kmh / 3.6f) / TIRE_CIRC_M;
    float engine_rps = rpm / 60.0f;
    float ratio      = engine_rps / (wheel_rps * FINAL_DRIVE);
    float best_err   = 1e6f;
    uint8_t best     = 0;
    for (uint8_t g = 0; g < GEAR_RATIOS_N; g++) {
        float err = fabsf(ratio - GEAR_RATIO[g]);
        if (err < best_err) { best_err = err; best = g + 1; }
    }
    return (best_err < 0.30f) ? best : 0;
}

// ═══════════════════════════════════════════════════════════════════
//  Inicialização
// ═══════════════════════════════════════════════════════════════════

void obd_init() {
    twai_general_config_t g = TWAI_GENERAL_CONFIG_DEFAULT(
        (gpio_num_t)PIN_CAN_TX, (gpio_num_t)PIN_CAN_RX, TWAI_MODE_NORMAL);
    twai_timing_config_t  t = TWAI_TIMING_CONFIG_500KBITS();
    twai_filter_config_t  f = TWAI_FILTER_CONFIG_ACCEPT_ALL();
    twai_driver_install(&g, &t, &f);
    twai_start();
    Serial.println("[OBD] TWAI iniciado @ 500 kbps");
}

// ═══════════════════════════════════════════════════════════════════
//  Atualização de dados — ciclo escalonado de PIDs
// ═══════════════════════════════════════════════════════════════════

bool obd_update(OBDData& d) {
    static uint8_t tick = 0;
    uint8_t resp[4];
    uint8_t len;

    // ── SEMPRE: RPM e velocidade (base para marcha) ───────────────
    if (!can_send_obd(0x01, 0x0C, resp, len) || len < 2) {
        d.valid = false;
        tick = 0;
        return false;
    }
    d.rpm = ((resp[0] << 8) | resp[1]) / 4;

    if (can_send_obd(0x01, 0x0D, resp, len)) d.speed = resp[0];

    d.gear  = calc_gear(d.rpm, d.speed);
    d.valid = true;

    // ── PIDs escalonados (tick 0-9, ciclo de 1 segundo) ───────────
    switch (tick % 10) {

    case 0: // temperatura líquido + MAP/boost
        if (can_send_obd(0x01, 0x05, resp, len)) d.coolant_temp = resp[0] - 40;
        if (can_send_obd(0x01, 0x0B, resp, len)) d.map_kpa      = resp[0];
        break;

    case 1: // acelerador + carga do motor
        if (can_send_obd(0x01, 0x11, resp, len)) d.throttle     = resp[0] * 100 / 255;
        if (can_send_obd(0x01, 0x04, resp, len)) d.engine_load  = resp[0] * 100 / 255;
        break;

    case 2: // MAF
        if (can_send_obd(0x01, 0x10, resp, len) && len >= 2)
            d.maf_gs = ((resp[0] << 8) | resp[1]) / 100.0f;
        break;

    case 3: // correções de combustível
        if (can_send_obd(0x01, 0x06, resp, len)) d.fuel_trim_st = (int8_t)(resp[0]) * 100 / 128 - 100;
        if (can_send_obd(0x01, 0x07, resp, len)) d.fuel_trim_lt = (int8_t)(resp[0]) * 100 / 128 - 100;
        break;

    case 4: // sonda O2 + avanço de ignição
        if (can_send_obd(0x01, 0x14, resp, len)) d.o2_raw      = resp[0];  // × 0.005 V
        if (can_send_obd(0x01, 0x0E, resp, len)) d.timing_adv  = (resp[0] / 2) - 64;
        break;

    case 5: // tensão + temperatura admissão
        if (can_send_obd(0x01, 0x42, resp, len) && len >= 2)
            d.voltage     = ((resp[0] << 8) | resp[1]) / 1000.0f;
        if (can_send_obd(0x01, 0x0F, resp, len)) d.intake_temp = resp[0] - 40;
        break;

    case 6: // temperatura óleo (pode não ser suportado no Up TSI)
        if (!can_send_obd(0x01, 0x5C, resp, len)) d.oil_temp = -40;  // não suportado
        else                                        d.oil_temp = resp[0] - 40;
        break;

    case 7: // temperatura ambiente + nível combustível
        if (can_send_obd(0x01, 0x46, resp, len)) d.ambient_temp = resp[0] - 40;
        if (can_send_obd(0x01, 0x2F, resp, len)) d.fuel_level   = resp[0] * 100 / 255;
        break;

    case 8: // Mode 22 — boost turbo VW (verifica suporte na primeira tentativa)
        {
            static bool m22_tested = false;
            if (!m22_tested || d.mode22_ok) {
                float atm_kpa = 101.3f;
                if (can_send_mode22(PID22_BOOST_TARGET, resp, len) && len >= 2) {
                    d.boost_target = ((resp[0] << 8) | resp[1]) * 0.1f - atm_kpa;
                    d.mode22_ok = true;
                } else {
                    // fallback: usa MAP Mode01 como pressão real (sem alvo)
                    d.boost_target = d.map_kpa - atm_kpa;
                    if (!m22_tested) { d.mode22_ok = false; m22_tested = true; }
                }
                if (d.mode22_ok && can_send_mode22(PID22_BOOST_ACTUAL, resp, len) && len >= 2)
                    d.boost_actual = ((resp[0] << 8) | resp[1]) * 0.1f - atm_kpa;
                else
                    d.boost_actual = d.map_kpa - atm_kpa;
                m22_tested = true;
            }
        }
        break;

    case 9: // MAP atualizado mais frequente (mesmo que case 0, mantém boost atual)
        if (can_send_obd(0x01, 0x0B, resp, len)) {
            d.map_kpa = resp[0];
            if (!d.mode22_ok) d.boost_actual = d.map_kpa - 101.0f;
        }
        break;
    }

    tick++;
    return true;
}

// ═══════════════════════════════════════════════════════════════════
//  Toggle TC via CAN
// ═══════════════════════════════════════════════════════════════════

bool obd_send_tc_toggle(bool enable) {
    if (TC_CAN_ID == 0x000) {
        Serial.println("[TC] Frame CAN não configurado — ver config.h");
        return false;
    }
    const uint8_t payload_on[]  = TC_PAYLOAD_ON;
    const uint8_t payload_off[] = TC_PAYLOAD_OFF;
    const uint8_t* payload = enable ? payload_on : payload_off;

    twai_message_t tx = {};
    tx.identifier       = TC_CAN_ID;
    tx.data_length_code = TC_PAYLOAD_LEN;
    memcpy(tx.data, payload, TC_PAYLOAD_LEN);
    return twai_transmit(&tx, pdMS_TO_TICKS(50)) == ESP_OK;
}

// ═══════════════════════════════════════════════════════════════════
//  Comandos UDS via OBD-II
//  ATENÇÃO: endereços e routine IDs precisam de verificação no carro
//  Usar VCDS para confirmar: módulo 17 → Testes de saída
// ═══════════════════════════════════════════════════════════════════

bool obd_cmd_needle_sweep() {
    // UDS RoutineControl start (0x31 0x01) no módulo de instrumentos
    // Routine ID 0xDE00 — VERIFICAR com VCDS módulo 17 antes de usar
    const uint8_t cmd[] = {0x31, 0x01, 0xDE, 0x00};
    bool ok = uds_send_cmd(UDS_ADDR_INSTR, cmd, sizeof(cmd));
    if (!ok) Serial.println("[UDS] needle_sweep falhou — verificar UDS_ADDR_INSTR em config.h");
    return ok;
}

bool obd_cmd_gauge_sweep() {
    // Similar ao needle_sweep — envia twice para varrer e retornar
    bool ok = obd_cmd_needle_sweep();
    if (ok) delay(2500);
    return ok;
}

bool obd_cmd_coming_home(bool enable) {
    // UDS IO Control (0x2F) no módulo BCM para ativar luzes coming home
    // DID 0x0105 — VERIFICAR com VCDS módulo 09 antes de usar
    const uint8_t cmd_on[]  = {0x2F, 0x01, 0x05, 0x03, 0x01};  // enable
    const uint8_t cmd_off[] = {0x2F, 0x01, 0x05, 0x00, 0x00};  // disable
    const uint8_t* cmd = enable ? cmd_on : cmd_off;
    uint8_t len = enable ? sizeof(cmd_on) : sizeof(cmd_off);
    bool ok = uds_send_cmd(UDS_ADDR_BCM, cmd, len);
    if (!ok) Serial.println("[UDS] coming_home falhou — verificar UDS_ADDR_BCM em config.h");
    return ok;
}
