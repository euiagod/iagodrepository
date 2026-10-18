#pragma once
#include "obd.h"

typedef enum {
    PAGE_MAIN    = 0,   // RPM + boost + velocidade + temperatura + marcha
    PAGE_DETAIL  = 1,   // carga + temperatura óleo + throttle + tensão
    PAGE_SENSORS = 2,   // MAF + fuel trims + sonda O2 + avanço ignição
    PAGE_GEAR    = 3,   // indicador de marcha grande
    PAGE_LAUNCH  = 4,   // launch control — RPM alvo + status
    PAGE_VCDS    = 5,   // botões de hacks VCDS (varredura, TC, luzes)
    PAGE_COUNT   = 6,
} Page;

void display_init();
void display_render(const OBDData& data, Page page, bool tc_on, uint16_t launch_rpm);
void display_set_backlight(uint8_t brightness);  // 0-255

// Leitura de toque — retorna true e preenche x,y (0-480, 0-320)
bool display_get_touch(uint16_t& x, uint16_t& y);
