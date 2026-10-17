#include "display.h"
#include "config.h"
#include <TFT_eSPI.h>

static TFT_eSPI tft;
static TFT_eSprite spr = TFT_eSprite(&tft);  // sprite para evitar flickering

// ── Paleta ─────────────────────────────────────────────────────────
#define C_BG        TFT_BLACK
#define C_ACCENT    0x07FF   // ciano
#define C_WARN      0xFD20   // laranja
#define C_DANGER    TFT_RED
#define C_TEXT      TFT_WHITE
#define C_DIM       0x7BEF   // cinza claro

static void draw_bar(int x, int y, int w, int h, int val, int max_val, uint16_t color) {
    int fill = (val * w) / max_val;
    fill = constrain(fill, 0, w);
    tft.fillRect(x, y, fill, h, color);
    tft.drawRect(x, y, w, h, C_DIM);
}

static void draw_main(const OBDData& d, bool tc_on) {
    spr.createSprite(SCREEN_W, SCREEN_H);
    spr.fillSprite(C_BG);

    // RPM — número grande
    spr.setTextColor(d.rpm >= RPM_REDLINE ? C_DANGER : C_TEXT);
    spr.setTextDatum(TL_DATUM);
    spr.setTextSize(1);
    spr.loadFont(0);  // fonte 7-seg grande (FONT7 se disponível)
    spr.setFreeFont(&FreeSansBold24pt7b);
    char buf[16];
    snprintf(buf, sizeof(buf), "%5d", d.rpm);
    spr.drawString(buf, 10, 10);
    spr.setFreeFont(nullptr);
    spr.setTextSize(1);
    spr.setTextColor(C_DIM);
    spr.drawString("RPM", 10, 80);

    // Barra de RPM (shift light integrada)
    uint16_t bar_color = (d.rpm >= RPM_SHIFT) ? C_DANGER : C_ACCENT;
    draw_bar(10, 110, 380, 18, d.rpm, RPM_REDLINE, bar_color);

    // Velocidade
    spr.setTextColor(C_TEXT);
    spr.setFreeFont(&FreeSansBold18pt7b);
    snprintf(buf, sizeof(buf), "%3d", d.speed);
    spr.drawString(buf, 10, 140);
    spr.setFreeFont(nullptr);
    spr.setTextColor(C_DIM);
    spr.drawString("km/h", 10, 185);

    // Temperatura do líquido
    uint16_t temp_color = (d.coolant_temp >= COOLANT_WARN) ? C_WARN : C_TEXT;
    spr.setTextColor(temp_color);
    spr.setFreeFont(&FreeSansBold18pt7b);
    snprintf(buf, sizeof(buf), "%3d", d.coolant_temp);
    spr.drawString(buf, 160, 140);
    spr.setFreeFont(nullptr);
    spr.setTextColor(C_DIM);
    spr.drawString("\xb0" "C", 160, 185);

    // Boost (MAP - 101 = sobrepressão relativa em kPa)
    int boost = (int)d.map_kpa - 101;
    spr.setTextColor(C_ACCENT);
    spr.setFreeFont(&FreeSansBold18pt7b);
    snprintf(buf, sizeof(buf), "%+4d", boost);
    spr.drawString(buf, 310, 140);
    spr.setFreeFont(nullptr);
    spr.setTextColor(C_DIM);
    spr.drawString("kPa", 310, 185);

    // Marcha
    spr.setTextColor(C_TEXT);
    spr.setFreeFont(&FreeSansBold24pt7b);
    spr.drawString(d.gear > 0 ? String(d.gear) : "N", 420, 140);

    // Tensão + status TC
    spr.setTextSize(1);
    spr.setFreeFont(nullptr);
    snprintf(buf, sizeof(buf), "%.1fV", d.voltage);
    spr.setTextColor(C_DIM);
    spr.drawString(buf, 10, 285);

    spr.setTextColor(tc_on ? C_ACCENT : C_DANGER);
    spr.drawString(tc_on ? "TC ON" : "TC OFF", 390, 285);

    // Sem sinal OBD
    if (!d.valid) {
        spr.fillRect(0, 0, SCREEN_W, 30, C_WARN);
        spr.setTextColor(TFT_BLACK);
        spr.drawCentreString("OBD DESCONECTADO", SCREEN_W / 2, 7, 2);
    }

    spr.pushSprite(0, 0);
    spr.deleteSprite();
}

static void draw_detail(const OBDData& d, bool tc_on) {
    spr.createSprite(SCREEN_W, SCREEN_H);
    spr.fillSprite(C_BG);

    struct Cell { const char* label; char value[12]; uint16_t color; };
    Cell cells[4] = {
        {"RPM",       "", C_TEXT},
        {"TEMP H2O",  "", C_TEXT},
        {"BOOST kPa", "", C_ACCENT},
        {"THROTTLE %","", C_TEXT},
    };
    snprintf(cells[0].value, 12, "%d",   d.rpm);
    snprintf(cells[1].value, 12, "%d",   d.coolant_temp);
    snprintf(cells[2].value, 12, "%+d",  (int)d.map_kpa - 101);
    snprintf(cells[3].value, 12, "%d",   d.throttle);

    if (d.coolant_temp >= COOLANT_WARN) cells[1].color = C_WARN;

    int cw = SCREEN_W / 2, ch = SCREEN_H / 2;
    for (int i = 0; i < 4; i++) {
        int cx = (i % 2) * cw, cy = (i / 2) * ch;
        tft.drawRect(cx, cy, cw, ch, C_DIM);
        spr.setTextColor(C_DIM);
        spr.drawString(cells[i].label, cx + 10, cy + 10, 2);
        spr.setTextColor(cells[i].color);
        spr.setFreeFont(&FreeSansBold18pt7b);
        spr.drawString(cells[i].value, cx + 10, cy + 50);
        spr.setFreeFont(nullptr);
    }

    spr.setTextColor(tc_on ? C_ACCENT : C_DANGER);
    spr.drawCentreString(tc_on ? "TC ON" : "TC OFF", SCREEN_W / 2, SCREEN_H - 20, 2);

    spr.pushSprite(0, 0);
    spr.deleteSprite();
}

static void draw_gear(const OBDData& d, bool tc_on) {
    spr.createSprite(SCREEN_W, SCREEN_H);
    spr.fillSprite(C_BG);

    spr.setTextColor(d.gear > 0 ? C_TEXT : C_DIM);
    spr.setFreeFont(&FreeSansBold24pt7b);
    spr.drawCentreString(d.gear > 0 ? String(d.gear) : "N", SCREEN_W / 2, 80);
    spr.setFreeFont(nullptr);

    char buf[16];
    snprintf(buf, sizeof(buf), "%d RPM", d.rpm);
    spr.setTextColor(C_DIM);
    spr.drawCentreString(buf, SCREEN_W / 2, 220, 2);

    spr.setTextColor(tc_on ? C_ACCENT : C_DANGER);
    spr.drawCentreString(tc_on ? "TC ATIVO" : "TC DESLIGADO", SCREEN_W / 2, 265, 2);

    spr.pushSprite(0, 0);
    spr.deleteSprite();
}

void display_init() {
    tft.init();
    tft.setRotation(1);
    tft.fillScreen(C_BG);
    ledcSetup(0, 5000, 8);
    ledcAttachPin(PIN_TFT_BL, 0);
    ledcWrite(0, 200);
}

void display_render(const OBDData& data, Page page, bool tc_on) {
    switch (page) {
        case PAGE_MAIN:   draw_main(data, tc_on);   break;
        case PAGE_DETAIL: draw_detail(data, tc_on); break;
        case PAGE_GEAR:   draw_gear(data, tc_on);   break;
        default: break;
    }
}

void display_set_backlight(uint8_t brightness) {
    ledcWrite(0, brightness);
}
