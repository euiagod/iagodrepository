#include <Arduino.h>
#include "obd.h"
#include "display.h"
#include "config.h"

static OBDData data = {};
static Page    current_page = PAGE_MAIN;
static bool    tc_on = true;

// ── Debounce do botão TC ───────────────────────────────────────────
static uint32_t tc_last_press = 0;
static bool     tc_btn_prev   = HIGH;

static void handle_tc_button() {
    bool pressed = (digitalRead(PIN_TC_BUTTON) == LOW);
    if (pressed && !tc_btn_prev && (millis() - tc_last_press > 300)) {
        tc_on = !tc_on;
        tc_last_press = millis();
        Serial.printf("[TC] Toggle → %s\n", tc_on ? "ON" : "OFF");
        if (!obd_send_tc_toggle(tc_on)) {
            Serial.println("[TC] Falha no envio CAN (frame não configurado?)");
        }
    }
    tc_btn_prev = pressed;
}

// ── Troca de página por toque na tela ─────────────────────────────
// XPT2046 via SPI2 — polling simples no TOUCH_CS
static uint32_t page_last_touch = 0;

static void handle_touch() {
    // Leitura básica do XPT2046: checar se CS está ativo indica toque
    // Para implementação completa usar biblioteca XPT2046_Touchscreen
    if (millis() - page_last_touch < 500) return;

    // Placeholder: troca página ao toque
    // TODO: integrar XPT2046_Touchscreen para coords reais
    // current_page = (Page)((current_page + 1) % PAGE_COUNT);
    // page_last_touch = millis();
}

void setup() {
    Serial.begin(115200);
    Serial.println("[BOOT] Dashboard Up TSI iniciando...");

    pinMode(PIN_TC_BUTTON, INPUT_PULLUP);

    display_init();
    obd_init();

    Serial.println("[BOOT] Pronto.");
}

void loop() {
    static uint32_t last_obd = 0;
    static uint32_t last_render = 0;

    handle_tc_button();
    handle_touch();

    // Atualiza OBD a cada 100ms
    if (millis() - last_obd >= 100) {
        obd_update(data);
        last_obd = millis();
    }

    // Renderiza display a ~30fps
    if (millis() - last_render >= 33) {
        display_render(data, current_page, tc_on);
        last_render = millis();
    }
}
