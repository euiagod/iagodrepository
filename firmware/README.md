# Dashboard Up TSI — Firmware ESP32

Réplica open-source do TDL EVO Street para VW Up TSI.

## Hardware

| Componente          | Modelo sugerido        | Onde comprar |
|---------------------|------------------------|--------------|
| MCU                 | ESP32 DevKit v1        | Mercado Livre |
| Transceiver CAN     | SN65HVD230             | AliExpress |
| Display             | ILI9488 3.5" SPI touch | AliExpress |
| Conector OBD-II     | Cabo OBD-II macho      | |

## Pinagem

| Função      | GPIO |
|-------------|------|
| CAN TX      | 21   |
| CAN RX      | 22   |
| TFT CS      | 15   |
| TFT DC      | 2    |
| TFT RST     | 4    |
| TFT MOSI    | 23   |
| TFT MISO    | 19   |
| TFT CLK     | 18   |
| TFT BL      | 32   |
| Touch CS    | 33   |
| Botão TC    | 35   |

## Build

```
# Instalar PlatformIO
pip install platformio

# Build + flash
cd firmware
pio run -t upload

# Monitor serial
pio device monitor
```

## Pendente: frame CAN do TC toggle

Único item faltante. Procedimento para capturar:

1. Conectar adaptador USB-CAN (ex: PCAN-USB, Canable) no OBD-II do Up
2. `sudo ip link set can0 up type can bitrate 500000`
3. `candump can0 -l captura.log`
4. Pressionar o botão TC físico do painel do carro **uma vez**
5. Parar captura — procurar o frame que apareceu 1x
6. Preencher `TC_CAN_ID`, `TC_PAYLOAD_ON`, `TC_PAYLOAD_OFF` em `include/config.h`
