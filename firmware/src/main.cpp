#include <Arduino.h>
#include "obd.h"
#include "display.h"
#include "config.h"

static OBDData   data        = {};
static Page      cur_page    = PAGE_MAIN;
static bool      tc_on       = true;
static uint16_t  launch_rpm  = LAUNCH_RPM_DEFAULT;

// ── Debounce botão TC ──────────────────────────────────────────────
static uint32_t tc_press_start  = 0;
static bool     tc_btn_prev     = HIGH;
static bool     tc_held         = false;   // botão segurado > LAUNCH_HOLD_MS

static void handle_tc_button() {
    bool pressed = (digitalRead(PIN_TC_BUTTON) == LOW);

    if (pressed && !tc_btn_prev) {
        // frente de descida: inicio de pressionamento
        tc_press_start = millis();
        tc_held = false;
    }

    if (pressed && !tc_held && (millis() - tc_press_start > LAUNCH_HOLD_MS)) {
        // segurado por LAUNCH_HOLD_MS → armar/desarmar launch control
        tc_held = true;
        data.launch_armed = !data.launch_armed;
        cur_page = data.launch_armed ? PAGE_LAUNCH : PAGE_MAIN;
        Serial.printf("[LC] Launch control %s\n", data.launch_armed ? "ARMADO" : "DESARMADO");
    }

    if (!pressed && tc_btn_prev && !tc_held) {
        // clique curto (solto antes do timeout)
        if (millis() - tc_press_start > 50) {  // debounce 50ms
            tc_on = !tc_on;
            data.tc_disabled = !tc_on;
            Serial.printf("[TC] Toggle → %s\n", tc_on ? "ON" : "OFF");
            if (!obd_send_tc_toggle(tc_on)) {
                Serial.println("[TC] Frame CAN pendente — ver config.h");
            }
        }
    }

    tc_btn_prev = pressed;
}

// ── Touch: navegação de páginas e botões VCDS ─────────────────────
static uint32_t touch_last  = 0;
static uint32_t touch_down  = 0;
static bool     touch_active = false;

static void handle_touch() {
    if (millis() - touch_last < 120) return;  // cooldown

    uint16_t tx, ty;
    bool touched = display_get_touch(tx, ty);

    if (touched && !touch_active) {
        touch_down = millis();
        touch_active = true;
    }

    if (!touched && touch_active) {
        touch_active = false;
        touch_last = millis();

        uint32_t held_ms = millis() - touch_down;
        if (held_ms < 50) return;  // rejeita ruído

        if (cur_page == PAGE_VCDS) {
            // Botões VCDS — mapeamento de zonas (mesmo layout do draw_vcds)
            // btn0: x=4..234, y=40..150 → needle sweep
            // btn1: x=244..474, y=40..150 → gauge sweep
            // btn2: x=4..234, y=158..268 → coming home
            // btn3: x=244..474, y=158..268 → TC toggle
            if (ty >= 40 && ty <= 150) {
                if (tx < 240) {
                    Serial.println("[VCDS] Needle sweep...");
                    obd_cmd_needle_sweep();
                } else {
                    Serial.println("[VCDS] Gauge sweep...");
                    obd_cmd_gauge_sweep();
                }
            } else if (ty >= 158 && ty <= 268) {
                if (tx < 240) {
                    static bool home = false;
                    home = !home;
                    Serial.printf("[VCDS] Coming home: %s\n", home ? "ON" : "OFF");
                    obd_cmd_coming_home(home);
                } else {
                    // TC toggle direto da tela VCDS
                    tc_on = !tc_on;
                    data.tc_disabled = !tc_on;
                    obd_send_tc_toggle(tc_on);
                }
            } else {
                // toque fora dos botões → próxima página
                cur_page = (Page)((cur_page + 1) % PAGE_COUNT);
            }
        } else if (cur_page == PAGE_LAUNCH) {
            // Na tela launch: toque esquerda = RPM -100, direita = RPM +100
            if (tx < SCREEN_W / 3) {
                launch_rpm = max((uint16_t)1500, (uint16_t)(launch_rpm - 100));
                Serial.printf("[LC] Alvo RPM → %d\n", launch_rpm);
            } else if (tx > SCREEN_W * 2 / 3) {
                launch_rpm = min((uint16_t)5000, (uint16_t)(launch_rpm + 100));
                Serial.printf("[LC] Alvo RPM → %d\n", launch_rpm);
            } else {
                // centro → próxima página / sair do launch
                data.launch_armed = false;
                cur_page = (Page)((cur_page + 1) % PAGE_COUNT);
            }
        } else {
            // Navegação normal: meio da tela = próxima página
            // esquerda = anterior, direita = próxima
            if (tx < SCREEN_W / 4) {
                cur_page = (Page)((cur_page - 1 + PAGE_COUNT) % PAGE_COUNT);
            } else {
                cur_page = (Page)((cur_page + 1) % PAGE_COUNT);
            }
        }
    }
}

// ── Setup ─────────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    Serial.println("[BOOT] Dashboard Up TSI v2.0 iniciando...");

    pinMode(PIN_TC_BUTTON, INPUT_PULLUP);

    display_init();
    obd_init();

    data.mode22_ok = false;
    Serial.println("[BOOT] Pronto. Aguardando OBD-II...");
}

// ── Loop ──────────────────────────────────────────────────────────
void loop() {
    static uint32_t last_obd    = 0;
    static uint32_t last_render = 0;

    handle_tc_button();
    handle_touch();

    // OBD: tick a cada 100ms
    if (millis() - last_obd >= 100) {
        obd_update(data);
        last_obd = millis();

        // Sair do launch se carro em movimento e RPM baixo
        if (data.launch_armed && data.speed > 10 && data.rpm < 800) {
            data.launch_armed = false;
            cur_page = PAGE_MAIN;
        }
    }

    // Display: ~30 fps
    if (millis() - last_render >= 33) {
        display_render(data, cur_page, tc_on, launch_rpm);
        last_render = millis();
    }
}
