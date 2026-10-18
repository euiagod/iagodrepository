#include "display.h"
#include "config.h"
#include <TFT_eSPI.h>

static TFT_eSPI   tft;
static TFT_eSprite spr = TFT_eSprite(&tft);

// ── Paleta ─────────────────────────────────────────────────────────
#define C_BG        TFT_BLACK
#define C_ACCENT    0x07FF   // ciano
#define C_GREEN     0x07E0   // verde
#define C_WARN      0xFD20   // laranja
#define C_DANGER    TFT_RED
#define C_TEXT      TFT_WHITE
#define C_DIM       0x7BEF   // cinza claro
#define C_PURPLE    0xF81F   // magenta
#define C_YELLOW    TFT_YELLOW

// ═══════════════════════════════════════════════════════════════════
//  Primitivas
// ═══════════════════════════════════════════════════════════════════

static void draw_bar(TFT_eSprite& s, int x, int y, int w, int h,
                     int val, int max_val, uint16_t color) {
    int fill = constrain((val * w) / max_val, 0, w);
    s.fillRect(x, y, fill, h, color);
    s.drawRect(x, y, w, h, C_DIM);
}

static void draw_label_value(TFT_eSprite& s, int x, int y,
                              const char* label, const char* value,
                              uint16_t val_color = C_TEXT) {
    s.setTextColor(C_DIM);
    s.drawString(label, x, y, 2);
    s.setTextColor(val_color);
    s.setFreeFont(&FreeSansBold12pt7b);
    s.drawString(value, x, y + 22);
    s.setFreeFont(nullptr);
}

static void draw_status_bar(TFT_eSprite& s, bool tc_on, bool mode22_ok, Page page) {
    // barra inferior: TC status + página atual + indicador Mode22
    int y = SCREEN_H - 22;
    s.fillRect(0, y, SCREEN_W, 22, 0x2104);  // fundo escuro

    s.setTextColor(tc_on ? C_ACCENT : C_DANGER);
    s.drawString(tc_on ? "TC" : "TC OFF", 8, y + 4, 2);

    // paginação: dots
    int dot_w = 8, dot_gap = 12, dot_total = PAGE_COUNT * dot_gap;
    int dot_x = (SCREEN_W - dot_total) / 2;
    for (int i = 0; i < PAGE_COUNT; i++) {
        uint16_t c = (i == (int)page) ? C_TEXT : C_DIM;
        s.fillCircle(dot_x + i * dot_gap + 4, y + 11, (i == (int)page) ? 4 : 2, c);
    }

    if (mode22_ok) {
        s.setTextColor(C_GREEN);
        s.drawString("M22", SCREEN_W - 36, y + 4, 2);
    }
}

// ═══════════════════════════════════════════════════════════════════
//  PAGE_MAIN: RPM + boost + velocidade + temperatura + marcha
// ═══════════════════════════════════════════════════════════════════

static void draw_main(const OBDData& d, bool tc_on) {
    spr.createSprite(SCREEN_W, SCREEN_H);
    spr.fillSprite(C_BG);
    char buf[20];

    // RPM — número grande
    spr.setTextColor(d.rpm >= RPM_REDLINE ? C_DANGER :
                     d.rpm >= RPM_SHIFT   ? C_WARN   : C_TEXT);
    spr.setFreeFont(&FreeSansBold24pt7b);
    snprintf(buf, sizeof(buf), "%5d", d.rpm);
    spr.drawString(buf, 8, 8);
    spr.setFreeFont(nullptr);
    spr.setTextColor(C_DIM);
    spr.drawString("RPM", 8, 76, 2);

    // Barra RPM (shift light integrada)
    uint16_t bar_c = (d.rpm >= RPM_SHIFT) ? C_DANGER :
                     (d.rpm >= (uint16_t)(RPM_SHIFT * 0.85f)) ? C_WARN : C_ACCENT;
    draw_bar(spr, 8, 96, 380, 14, d.rpm, RPM_REDLINE, bar_c);
    // marcador shift
    int shift_x = 8 + (RPM_SHIFT * 380 / RPM_REDLINE);
    spr.drawFastVLine(shift_x, 94, 18, C_WARN);

    // Velocidade
    spr.setTextColor(C_TEXT);
    spr.setFreeFont(&FreeSansBold18pt7b);
    snprintf(buf, sizeof(buf), "%3d", d.speed);
    spr.drawString(buf, 8, 120);
    spr.setFreeFont(nullptr);
    spr.setTextColor(C_DIM);
    spr.drawString("km/h", 8, 162, 2);

    // Temperatura líquido
    uint16_t tc_color = (d.coolant_temp >= COOLANT_WARN) ? C_WARN :
                        (d.coolant_temp < 70) ? C_ACCENT : C_TEXT;
    spr.setTextColor(tc_color);
    spr.setFreeFont(&FreeSansBold18pt7b);
    snprintf(buf, sizeof(buf), "%3d°", d.coolant_temp);
    spr.drawString(buf, 150, 120);
    spr.setFreeFont(nullptr);
    spr.setTextColor(C_DIM);
    spr.drawString("H2O", 150, 162, 2);

    // Boost
    float boost = d.boost_actual;
    uint16_t b_color = (boost > 100) ? C_DANGER :
                       (boost > 60)  ? C_WARN   :
                       (boost > 5)   ? C_ACCENT  : C_DIM;
    spr.setTextColor(b_color);
    spr.setFreeFont(&FreeSansBold18pt7b);
    snprintf(buf, sizeof(buf), "%+.0f", boost);
    spr.drawString(buf, 300, 120);
    spr.setFreeFont(nullptr);
    spr.setTextColor(C_DIM);
    spr.drawString("kPa", 300, 162, 2);

    // Barra de boost (0 até BOOST_MAX_KPA)
    int boost_pct = constrain((int)boost, 0, BOOST_MAX_KPA);
    draw_bar(spr, 8, 185, 380, 10, boost_pct, BOOST_MAX_KPA, b_color);
    // linha alvo boost (Mode 22)
    if (d.mode22_ok && d.boost_target > 0) {
        int tgt_x = 8 + (int)(d.boost_target * 380 / BOOST_MAX_KPA);
        spr.drawFastVLine(constrain(tgt_x, 8, 388), 183, 14, C_YELLOW);
    }

    // Marcha
    spr.setTextColor(d.gear > 0 ? C_TEXT : C_DIM);
    spr.setFreeFont(&FreeSansBold24pt7b);
    spr.drawString(d.gear > 0 ? String(d.gear) : "-", 430, 120);
    spr.setFreeFont(nullptr);
    spr.setTextColor(C_DIM);
    spr.drawString("gear", 424, 162, 2);

    // Barra velocidade
    draw_bar(spr, 8, 205, 380, 8, d.speed, 160, C_GREEN);

    if (!d.valid) {
        spr.fillRect(0, 0, SCREEN_W, 28, C_WARN);
        spr.setTextColor(C_BG);
        spr.drawCentreString("OBD DESCONECTADO", SCREEN_W / 2, 6, 2);
    }

    draw_status_bar(spr, tc_on, d.mode22_ok, PAGE_MAIN);
    spr.pushSprite(0, 0);
    spr.deleteSprite();
}

// ═══════════════════════════════════════════════════════════════════
//  PAGE_DETAIL: carga motor + óleo + acelerador + tensão
// ═══════════════════════════════════════════════════════════════════

static void draw_detail(const OBDData& d, bool tc_on) {
    spr.createSprite(SCREEN_W, SCREEN_H);
    spr.fillSprite(C_BG);
    char buf[16];

    struct Cell { const char* lbl; char val[14]; uint16_t color; bool bar; int bval; int bmax; };
    Cell cells[6] = {
        {"CARGA",     "", C_TEXT,   true,  d.engine_load,  100},
        {"ACELER.",   "", C_TEXT,   true,  d.throttle,     100},
        {"TEMP H2O",  "", C_TEXT,   false, 0, 0},
        {"TEMP OLEO", "", C_TEXT,   false, 0, 0},
        {"TENSÃO",    "", C_TEXT,   false, 0, 0},
        {"BOOST",     "", C_ACCENT, true,  0, 0},
    };
    snprintf(cells[0].val, 14, "%d %%",   d.engine_load);
    snprintf(cells[1].val, 14, "%d %%",   d.throttle);
    snprintf(cells[2].val, 14, "%d°C",    d.coolant_temp);
    snprintf(cells[3].val, 14, "%d°C",    d.oil_temp > -40 ? d.oil_temp : 0);
    snprintf(cells[4].val, 14, "%.1f V",  d.voltage);
    snprintf(cells[5].val, 14, "%+.0fkPa", d.boost_actual);
    cells[5].bval = constrain((int)d.boost_actual, 0, BOOST_MAX_KPA);
    cells[5].bmax = BOOST_MAX_KPA;

    if (d.coolant_temp >= COOLANT_WARN) cells[2].color = C_WARN;
    if (d.oil_temp > OIL_WARN_TEMP)    cells[3].color = C_WARN;
    if (d.oil_temp <= -40)             { snprintf(cells[3].val, 14, "N/A"); cells[3].color = C_DIM; }

    int cw = SCREEN_W / 3, ch = (SCREEN_H - 22) / 2;
    for (int i = 0; i < 6; i++) {
        int cx = (i % 3) * cw + 4, cy = (i / 3) * ch + 4;
        spr.drawRect(cx, cy, cw - 4, ch - 4, C_DIM);
        spr.setTextColor(C_DIM);
        spr.drawString(cells[i].lbl, cx + 8, cy + 8, 2);
        spr.setTextColor(cells[i].color);
        spr.setFreeFont(&FreeSansBold12pt7b);
        spr.drawString(cells[i].val, cx + 8, cy + 34);
        spr.setFreeFont(nullptr);
        if (cells[i].bar) {
            draw_bar(spr, cx + 8, cy + ch - 20, cw - 28, 8,
                     cells[i].bval, cells[i].bmax, cells[i].color);
        }
    }

    draw_status_bar(spr, tc_on, d.mode22_ok, PAGE_DETAIL);
    spr.pushSprite(0, 0);
    spr.deleteSprite();
}

// ═══════════════════════════════════════════════════════════════════
//  PAGE_SENSORS: MAF + fuel trims + O2 + avanço ignição
// ═══════════════════════════════════════════════════════════════════

static void draw_sensors(const OBDData& d, bool tc_on) {
    spr.createSprite(SCREEN_W, SCREEN_H);
    spr.fillSprite(C_BG);
    char buf[20];

    // Título
    spr.setTextColor(C_ACCENT);
    spr.drawString("SENSORES EXPANDIDOS", 8, 6, 2);
    spr.drawFastHLine(0, 22, SCREEN_W, C_DIM);

    int row = 32, col1 = 8, col2 = 250;

    // MAF
    spr.setTextColor(C_DIM); spr.drawString("MAF (g/s)", col1, row, 2);
    snprintf(buf, sizeof(buf), "%.1f g/s", d.maf_gs);
    spr.setTextColor(C_TEXT); spr.setFreeFont(&FreeSansBold12pt7b);
    spr.drawString(buf, col1, row + 16); spr.setFreeFont(nullptr);
    draw_bar(spr, col1, row + 46, 200, 8, (int)(d.maf_gs), 100, C_GREEN);

    // Sonda O2 (narrowband)
    float o2_v = d.o2_raw * 0.005f;
    uint16_t o2_c = (o2_v > 0.6f) ? C_DANGER :    // rich
                    (o2_v < 0.3f) ? C_ACCENT  :    // lean
                                    C_TEXT;
    spr.setTextColor(C_DIM); spr.drawString("O2 / SONDA (V)", col2, row, 2);
    snprintf(buf, sizeof(buf), "%.3f V", o2_v);
    spr.setTextColor(o2_c); spr.setFreeFont(&FreeSansBold12pt7b);
    spr.drawString(buf, col2, row + 16); spr.setFreeFont(nullptr);
    spr.setTextColor(o2_c);
    spr.drawString(o2_v > 0.6f ? "RICH" : o2_v < 0.3f ? "LEAN" : "STOICH",
                   col2 + 120, row + 16, 2);

    row = 110;

    // Fuel trim curto prazo
    uint16_t ft_c = abs(d.fuel_trim_st) > 10 ? C_WARN : C_TEXT;
    spr.setTextColor(C_DIM); spr.drawString("FUEL TRIM ST (%)", col1, row, 2);
    snprintf(buf, sizeof(buf), "%+d %%", d.fuel_trim_st);
    spr.setTextColor(ft_c); spr.setFreeFont(&FreeSansBold12pt7b);
    spr.drawString(buf, col1, row + 16); spr.setFreeFont(nullptr);

    // Fuel trim longo prazo
    uint16_t ftl_c = abs(d.fuel_trim_lt) > 10 ? C_WARN : C_TEXT;
    spr.setTextColor(C_DIM); spr.drawString("FUEL TRIM LT (%)", col2, row, 2);
    snprintf(buf, sizeof(buf), "%+d %%", d.fuel_trim_lt);
    spr.setTextColor(ftl_c); spr.setFreeFont(&FreeSansBold12pt7b);
    spr.drawString(buf, col2, row + 16); spr.setFreeFont(nullptr);

    row = 188;
    spr.drawFastHLine(0, row - 4, SCREEN_W, C_DIM);

    // Avanço de ignição
    spr.setTextColor(C_DIM); spr.drawString("AVANÇO IGNIÇÃO (°)", col1, row, 2);
    snprintf(buf, sizeof(buf), "%+d°", d.timing_adv);
    spr.setTextColor(C_TEXT); spr.setFreeFont(&FreeSansBold12pt7b);
    spr.drawString(buf, col1, row + 16); spr.setFreeFont(nullptr);

    // Temperatura admissão
    spr.setTextColor(C_DIM); spr.drawString("T. ADMISSÃO (°C)", col2, row, 2);
    snprintf(buf, sizeof(buf), "%d°C", d.intake_temp);
    uint16_t it_c = d.intake_temp > 50 ? C_WARN : C_TEXT;
    spr.setTextColor(it_c); spr.setFreeFont(&FreeSansBold12pt7b);
    spr.drawString(buf, col2, row + 16); spr.setFreeFont(nullptr);

    draw_status_bar(spr, tc_on, d.mode22_ok, PAGE_SENSORS);
    spr.pushSprite(0, 0);
    spr.deleteSprite();
}

// ═══════════════════════════════════════════════════════════════════
//  PAGE_GEAR: indicador de marcha grande
// ═══════════════════════════════════════════════════════════════════

static void draw_gear(const OBDData& d, bool tc_on) {
    spr.createSprite(SCREEN_W, SCREEN_H);
    spr.fillSprite(C_BG);
    char buf[8];

    spr.setTextColor(d.gear > 0 ? C_TEXT : C_DIM);
    spr.setFreeFont(&FreeSansBold24pt7b);
    spr.setTextSize(3);
    spr.setTextDatum(MC_DATUM);
    spr.drawString(d.gear > 0 ? String(d.gear) : "N", SCREEN_W / 2, 80);
    spr.setTextDatum(TL_DATUM);
    spr.setTextSize(1);
    spr.setFreeFont(nullptr);

    snprintf(buf, sizeof(buf), "%d RPM", d.rpm);
    spr.setTextColor(C_DIM);
    spr.drawCentreString(buf, SCREEN_W / 2, 218, 2);

    snprintf(buf, sizeof(buf), "%d km/h", d.speed);
    spr.drawCentreString(buf, SCREEN_W / 2, 240, 2);

    // barra shift
    uint16_t bc = (d.rpm >= RPM_SHIFT) ? C_DANGER :
                  (d.rpm >= (uint16_t)(RPM_SHIFT * 0.85f)) ? C_WARN : C_ACCENT;
    draw_bar(spr, 40, 265, SCREEN_W - 80, 12, d.rpm, RPM_REDLINE, bc);

    draw_status_bar(spr, tc_on, d.mode22_ok, PAGE_GEAR);
    spr.pushSprite(0, 0);
    spr.deleteSprite();
}

// ═══════════════════════════════════════════════════════════════════
//  PAGE_LAUNCH: launch control
// ═══════════════════════════════════════════════════════════════════

static void draw_launch(const OBDData& d, bool tc_on, uint16_t launch_rpm) {
    spr.createSprite(SCREEN_W, SCREEN_H);
    spr.fillSprite(C_BG);
    char buf[20];

    bool armed = d.launch_armed;
    bool over  = d.rpm > launch_rpm;

    // Fundo piscante se RPM > alvo
    static uint8_t flash = 0;
    if (over && armed) {
        flash++;
        if (flash & 0x08) spr.fillSprite(0x3000);  // vermelho escuro
    } else {
        flash = 0;
    }

    // Título status
    spr.setTextColor(armed ? (over ? C_DANGER : C_ACCENT) : C_DIM);
    spr.setFreeFont(&FreeSansBold12pt7b);
    spr.setTextDatum(MC_DATUM);
    if (!armed) spr.drawString("SEGURAR BOTAO TC (2s) PARA ARMAR", SCREEN_W / 2, 20);
    else if (over) spr.drawString("ACIMA DO ALVO - SOLTAR ACELERADOR!", SCREEN_W / 2, 20);
    else spr.drawString("ARMADO - SEGURAR RPM NO ALVO", SCREEN_W / 2, 20);
    spr.setTextDatum(TL_DATUM);
    spr.setFreeFont(nullptr);

    // RPM grande
    spr.setTextColor(over ? C_DANGER : (armed ? C_ACCENT : C_DIM));
    spr.setFreeFont(&FreeSansBold24pt7b);
    spr.setTextSize(2);
    spr.setTextDatum(MC_DATUM);
    snprintf(buf, sizeof(buf), "%4d", d.rpm);
    spr.drawString(buf, SCREEN_W / 2, 90);
    spr.setTextDatum(TL_DATUM);
    spr.setTextSize(1);
    spr.setFreeFont(nullptr);
    spr.setTextColor(C_DIM);
    spr.drawCentreString("RPM", SCREEN_W / 2, 178, 2);

    // Barra RPM com marcador de alvo
    int bar_x = 30, bar_y = 196, bar_w = SCREEN_W - 60, bar_h = 20;
    draw_bar(spr, bar_x, bar_y, bar_w, bar_h, d.rpm, RPM_REDLINE,
             over ? C_DANGER : C_ACCENT);
    // marcador de alvo
    int tgt_x = bar_x + (int)((long)launch_rpm * bar_w / RPM_REDLINE);
    spr.fillRect(tgt_x - 2, bar_y - 4, 4, bar_h + 8, C_YELLOW);

    // Alvo numérico
    spr.setTextColor(C_YELLOW);
    snprintf(buf, sizeof(buf), "ALVO: %d RPM", launch_rpm);
    spr.drawCentreString(buf, SCREEN_W / 2, 228, 2);

    // Instrução TC
    spr.setTextColor(tc_on ? C_DIM : C_ACCENT);
    spr.drawCentreString(tc_on ? "TC ATIVO (desligar para launch)" :
                                 "TC DESLIGADO  ✓", SCREEN_W / 2, 252, 2);

    draw_status_bar(spr, tc_on, d.mode22_ok, PAGE_LAUNCH);
    spr.pushSprite(0, 0);
    spr.deleteSprite();
}

// ═══════════════════════════════════════════════════════════════════
//  PAGE_VCDS: botões de hacks (4 zonas touch)
// ═══════════════════════════════════════════════════════════════════

static void draw_vcds(const OBDData& d, bool tc_on) {
    spr.createSprite(SCREEN_W, SCREEN_H);
    spr.fillSprite(C_BG);

    spr.setTextColor(C_ACCENT);
    spr.drawString("VCDS HACKS", 8, 6, 2);
    spr.drawFastHLine(0, 22, SCREEN_W, C_DIM);
    spr.setTextColor(C_DIM);
    spr.drawString("toque no botao para executar", 8, 26, 1);

    struct Btn {
        const char* label;
        const char* sub;
        uint16_t color;
        int x, y, w, h;
    };

    // Layout 2×2 — (x, y, w, h) — zona de toque mapeada em main.cpp
    Btn btns[4] = {
        {"NEEDLE SWEEP",  "varredura agulhas",   C_ACCENT, 4,   40,  230, 110},
        {"GAUGE SWEEP",   "todos os gauges",     C_ACCENT, 244, 40,  230, 110},
        {"COMING HOME",   "luzes going home",    C_PURPLE, 4,   158, 230, 110},
        {"TC TOGGLE",     tc_on ? "TC LIGADO" : "TC DESLIGADO",
                                                 (uint16_t)(tc_on ? C_TEXT : C_WARN),
                                                         244, 158, 230, 110},
    };

    for (int i = 0; i < 4; i++) {
        Btn& b = btns[i];
        spr.drawRect(b.x, b.y, b.w, b.h, b.color);
        spr.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2, 0x1082);  // fundo levemente claro
        spr.setTextColor(b.color);
        spr.setFreeFont(&FreeSansBold12pt7b);
        spr.drawString(b.label, b.x + 10, b.y + 28);
        spr.setFreeFont(nullptr);
        spr.setTextColor(C_DIM);
        spr.drawString(b.sub, b.x + 10, b.y + 70, 2);

        // aviso UDS
        if (i < 3) {
            spr.setTextColor(0x4208);  // cinza muito escuro
            spr.drawString("verificar addr", b.x + 10, b.y + 88, 1);
        }
    }

    draw_status_bar(spr, tc_on, d.mode22_ok, PAGE_VCDS);
    spr.pushSprite(0, 0);
    spr.deleteSprite();
}

// ═══════════════════════════════════════════════════════════════════
//  API pública
// ═══════════════════════════════════════════════════════════════════

void display_init() {
    tft.init();
    tft.setRotation(1);
    tft.fillScreen(C_BG);
    ledcSetup(0, 5000, 8);
    ledcAttachPin(PIN_TFT_BL, 0);
    ledcWrite(0, 220);
    tft.calibrateTouch(nullptr, TFT_WHITE, TFT_BLACK, 15);
}

void display_render(const OBDData& data, Page page, bool tc_on, uint16_t launch_rpm) {
    switch (page) {
        case PAGE_MAIN:    draw_main(data, tc_on);              break;
        case PAGE_DETAIL:  draw_detail(data, tc_on);            break;
        case PAGE_SENSORS: draw_sensors(data, tc_on);           break;
        case PAGE_GEAR:    draw_gear(data, tc_on);              break;
        case PAGE_LAUNCH:  draw_launch(data, tc_on, launch_rpm); break;
        case PAGE_VCDS:    draw_vcds(data, tc_on);              break;
        default: break;
    }
}

void display_set_backlight(uint8_t brightness) {
    ledcWrite(0, brightness);
}

bool display_get_touch(uint16_t& x, uint16_t& y) {
    return tft.getTouch(&x, &y, 600);
}
