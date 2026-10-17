#pragma once
#include "obd.h"

enum Page {
    PAGE_MAIN = 0,   // RPM + velocidade + boost + temp
    PAGE_DETAIL,     // 4 parâmetros configuráveis
    PAGE_GEAR,       // indicador de marcha grande
    PAGE_COUNT
};

void display_init();
void display_render(const OBDData& data, Page page, bool tc_on);
void display_set_backlight(uint8_t brightness);  // 0-255
