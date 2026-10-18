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
#define OBD_PHYS_ID     0x7E0        // endereço físico ECU (motor, confirmado)
#define OBD_TIMEOUT_MS  100

// ── Dimensões do display (ILI9488 3.5") ────────────────────────────
#define SCREEN_W        480
#define SCREEN_H        320

// ── Parâmetros de exibição ─────────────────────────────────────────
#define RPM_REDLINE     6500
#define RPM_SHIFT       6200         // acende shift light
#define COOLANT_WARN    105          // °C alerta temperatura líquido
#define OIL_WARN_TEMP   130          // °C alerta temperatura óleo
#define BOOST_MAX_KPA   200          // kPa máximo barra de boost (turbo)
#define GEAR_RATIOS_N   6

// ── Launch Control ─────────────────────────────────────────────────
#define LAUNCH_RPM_DEFAULT  3500     // RPM alvo padrão para largada
#define LAUNCH_HOLD_MS      2000     // ms segurar botão TC para armar

// ── TC toggle CAN frame (Up TSI) ───────────────────────────────────
// Procedimento de captura:
//   1. Conectar adaptador USB-CAN no OBD-II do Up
//   2. sudo ip link set can0 up type can bitrate 500000
//   3. candump can0 -l captura.log
//   4. Pressionar botão TC físico do painel UMA VEZ
//   5. Parar captura — o frame que apareceu 1x = TC toggle
//   6. Preencher as constantes abaixo
#define TC_CAN_ID       0x000        // <<< PREENCHER após sniffing
#define TC_PAYLOAD_ON   {0x00}       // <<< PREENCHER após sniffing
#define TC_PAYLOAD_OFF  {0x00}       // <<< PREENCHER após sniffing
#define TC_PAYLOAD_LEN  1            // <<< PREENCHER após sniffing

// ── UDS / KWP2000 endereços físicos (via OBD-II ISO-TP) ─────────────
// Verificar no carro: VCDS → [Módulo] → mostra o CAN ID de resposta
// Tipicamente: request = resp - 8 (padrão VW PQ26)
#define UDS_ADDR_ENGINE     0x7E0    // ECU motor (confirmado via firmware)
#define UDS_ADDR_ABS        0x7A0    // módulo ABS/ESP — verificar no carro
#define UDS_ADDR_INSTR      0x760    // painel de instrumentos — verificar
#define UDS_ADDR_BCM        0x765    // módulo conforto/BCM — verificar

// ── Mode 22 PIDs VW-específicos (MED17.x / motor CHY-CHZ) ─────────
// Confirmar suporte no carro (VCDS → Módulo 01 → Grupo de medição)
#define PID22_BOOST_TARGET  0x04A2   // pressão turbo alvo (0.1 kPa/bit)
#define PID22_BOOST_ACTUAL  0x04A3   // pressão turbo real  (0.1 kPa/bit)
#define PID22_OIL_TEMP      0x04C1   // temperatura óleo estimada ECU
