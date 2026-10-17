#pragma once
#include <stdint.h>
#include <stdbool.h>

struct OBDData {
    uint16_t rpm;           // RPM
    uint8_t  speed;         // km/h
    int8_t   coolant_temp;  // °C
    int8_t   intake_temp;   // °C
    uint8_t  throttle;      // 0-100 %
    uint8_t  map_kpa;       // pressão absoluta intake (kPa)
    uint8_t  gear;          // marcha calculada (0=neutro)
    float    voltage;       // tensão bateria (V)
    bool     tc_active;     // status TC (estimado por sinal do carro)
    bool     valid;         // dados válidos (OBD conectado)
};

void obd_init();
bool obd_update(OBDData& data);
bool obd_send_tc_toggle(bool enable);
