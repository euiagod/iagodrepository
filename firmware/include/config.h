#pragma once

// ── Pinagem ESP32 ──────────────────────────────────────────────────
#define PIN_CAN_TX      21
#define PIN_CAN_RX      22
#define PIN_TC_BUTTON   35   // botão TC on/off (GPIO input-only)
#define PIN_TFT_BL      32   // backlight do display

// ── CAN / OBD-II ──────────────────────────────────────────────────
#define CAN_SPEED       500E3        // 500 kbps OBD-II padrão VW
#define OBD_REQUEST_ID  0x7DF        // broadcast funcional OBD-II
#define OBD_RESPONSE_ID 0x7E8        // resposta do ECU principal
#define OBD_TIMEOUT_MS  100

// ── Dimensões do display (ILI9488 3.5") ────────────────────────────
#define SCREEN_W        480
#define SCREEN_H        320

// ── Parâmetros de exibição ─────────────────────────────────────────
#define RPM_REDLINE     6500
#define RPM_SHIFT       6200         // acende shift light
#define COOLANT_WARN    105          // °C alerta temperatura
#define GEAR_RATIOS_N   6

// ── TC toggle CAN frame (Up TSI) ───────────────────────────────────
// TODO: capturar com USB-CAN no carro enquanto pressiona o botão TC físico.
// Executar: candump can0 | grep "ID" enquanto pressiona o botão TC do painel.
// Preencher os valores abaixo com o frame capturado.
#define TC_CAN_ID       0x000        // <<< PREENCHER após sniffing
#define TC_PAYLOAD_ON   {0x00}       // <<< PREENCHER após sniffing
#define TC_PAYLOAD_OFF  {0x00}       // <<< PREENCHER após sniffing
#define TC_PAYLOAD_LEN  1            // <<< PREENCHER após sniffing
