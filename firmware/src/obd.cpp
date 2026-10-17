#include "obd.h"
#include "config.h"
#include <Arduino.h>
#include <driver/twai.h>

// ── Razões das marchas do Up TSI 1.0 (velocidade/RPM × 1000) ───────
static const float GEAR_RATIO[GEAR_RATIOS_N] = {
    3.455f, 1.944f, 1.370f, 1.029f, 0.820f, 0.673f
};
static const float FINAL_DRIVE = 3.941f;
static const float TIRE_CIRC_M = 1.82f;  // pneu 175/65 R14

static bool can_send_obd(uint8_t mode, uint8_t pid, uint8_t* resp, uint8_t& len) {
    twai_message_t tx = {};
    tx.identifier = OBD_REQUEST_ID;
    tx.data_length_code = 8;
    tx.data[0] = 0x02;
    tx.data[1] = mode;
    tx.data[2] = pid;

    if (twai_transmit(&tx, pdMS_TO_TICKS(50)) != ESP_OK) return false;

    twai_message_t rx = {};
    uint32_t deadline = millis() + OBD_TIMEOUT_MS;
    while (millis() < deadline) {
        if (twai_receive(&rx, pdMS_TO_TICKS(10)) == ESP_OK) {
            if (rx.identifier == OBD_RESPONSE_ID && rx.data[1] == mode + 0x40 && rx.data[2] == pid) {
                len = rx.data[0] - 2;
                for (uint8_t i = 0; i < len; i++) resp[i] = rx.data[3 + i];
                return true;
            }
        }
    }
    return false;
}

static uint8_t calc_gear(uint16_t rpm, uint8_t speed_kmh) {
    if (rpm < 300 || speed_kmh < 5) return 0;
    float wheel_rps = (speed_kmh / 3.6f) / TIRE_CIRC_M;
    float engine_rps = rpm / 60.0f;
    float ratio = engine_rps / (wheel_rps * FINAL_DRIVE);
    float best_err = 1e6f;
    uint8_t best = 0;
    for (uint8_t g = 0; g < GEAR_RATIOS_N; g++) {
        float err = fabsf(ratio - GEAR_RATIO[g]);
        if (err < best_err) { best_err = err; best = g + 1; }
    }
    return (best_err < 0.25f) ? best : 0;
}

void obd_init() {
    twai_general_config_t g = TWAI_GENERAL_CONFIG_DEFAULT((gpio_num_t)PIN_CAN_TX, (gpio_num_t)PIN_CAN_RX, TWAI_MODE_NORMAL);
    twai_timing_config_t  t = TWAI_TIMING_CONFIG_500KBITS();
    twai_filter_config_t  f = TWAI_FILTER_CONFIG_ACCEPT_ALL();
    twai_driver_install(&g, &t, &f);
    twai_start();
}

bool obd_update(OBDData& d) {
    uint8_t resp[4];
    uint8_t len;

    // RPM — modo 01 PID 0x0C
    if (!can_send_obd(0x01, 0x0C, resp, len) || len < 2) { d.valid = false; return false; }
    d.rpm = ((resp[0] << 8) | resp[1]) / 4;

    // Velocidade — 0x0D
    if (can_send_obd(0x01, 0x0D, resp, len)) d.speed = resp[0];

    // Temperatura do líquido — 0x05
    if (can_send_obd(0x01, 0x05, resp, len)) d.coolant_temp = resp[0] - 40;

    // Temperatura do ar intake — 0x0F
    if (can_send_obd(0x01, 0x0F, resp, len)) d.intake_temp = resp[0] - 40;

    // Posição do acelerador — 0x11
    if (can_send_obd(0x01, 0x11, resp, len)) d.throttle = resp[0] * 100 / 255;

    // MAP (pressão absoluta intake) — 0x0B
    if (can_send_obd(0x01, 0x0B, resp, len)) d.map_kpa = resp[0];

    // Tensão do módulo — 0x42
    if (can_send_obd(0x01, 0x42, resp, len) && len >= 2)
        d.voltage = ((resp[0] << 8) | resp[1]) / 1000.0f;

    d.gear  = calc_gear(d.rpm, d.speed);
    d.valid = true;
    return true;
}

bool obd_send_tc_toggle(bool enable) {
    // TODO: preencher após capturar o frame CAN no carro.
    // Procedimento: conectar USB-CAN no OBD-II, executar
    //   candump can0 -l captura.log
    // pressionar o botão TC físico do painel do Up, parar captura.
    // O frame que aparece uma vez = TC_CAN_ID + payload.
    // Atualizar TC_CAN_ID, TC_PAYLOAD_ON, TC_PAYLOAD_OFF em config.h.

    if (TC_CAN_ID == 0x000) {
        Serial.println("[TC] Frame não configurado — capturar CAN primeiro");
        return false;
    }

    const uint8_t payload_on[]  = TC_PAYLOAD_ON;
    const uint8_t payload_off[] = TC_PAYLOAD_OFF;
    const uint8_t* payload = enable ? payload_on : payload_off;

    twai_message_t tx = {};
    tx.identifier = TC_CAN_ID;
    tx.data_length_code = TC_PAYLOAD_LEN;
    memcpy(tx.data, payload, TC_PAYLOAD_LEN);

    return twai_transmit(&tx, pdMS_TO_TICKS(50)) == ESP_OK;
}
