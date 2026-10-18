# Dashboard Up TSI — Firmware ESP32 v2.0

Dashboard open-source para VW Up TSI, construído do zero.
Substitui/supera o TDL EVO Street 3.5" e The Dash.

## Hardware

| Componente          | Modelo                 | Obs                        |
|---------------------|------------------------|----------------------------|
| MCU                 | ESP32 DevKit v1        | TWAI CAN integrado         |
| Transceiver CAN     | SN65HVD230 (3.3V)      | Sem shield separado        |
| Display             | ILI9488 3.5" SPI touch | XPT2046 integrado          |
| Conector OBD-II     | Cabo OBD-II macho      | Pinos 6 (CAN-H) + 14 (CAN-L)|

## Pinagem

| Função      | GPIO | Notas                   |
|-------------|------|-------------------------|
| CAN TX      | 21   | → SN65HVD230 TXD        |
| CAN RX      | 22   | ← SN65HVD230 RXD        |
| TFT CS      | 15   |                         |
| TFT DC      | 2    |                         |
| TFT RST     | 4    |                         |
| TFT MOSI    | 23   | SPI compartilhado       |
| TFT MISO    | 19   |                         |
| TFT CLK     | 18   |                         |
| TFT BL      | 32   | PWM backlight           |
| Touch CS    | 33   | XPT2046 (TFT_eSPI nativo)|
| Botão TC    | 35   | INPUT_PULLUP, click < 2s|

## Parâmetros monitorados (25 sensores)

### Mode 01 — OBD-II padrão
| PID  | Parâmetro              | Atualização |
|------|------------------------|-------------|
| 0x0C | RPM                    | 100ms       |
| 0x0D | Velocidade km/h        | 100ms       |
| 0x05 | Temperatura líquido °C | 1s          |
| 0x0B | MAP / boost kPa        | 200ms       |
| 0x11 | Posição acelerador %   | 200ms       |
| 0x04 | Carga motor %          | 200ms       |
| 0x10 | MAF g/s                | 300ms       |
| 0x06 | Fuel trim curto prazo %| 400ms       |
| 0x07 | Fuel trim longo prazo %| 400ms       |
| 0x14 | Sonda O2 narrowband V  | 500ms       |
| 0x0E | Avanço ignição °       | 500ms       |
| 0x42 | Tensão bateria V       | 600ms       |
| 0x0F | Temperatura admissão °C| 600ms       |
| 0x5C | Temperatura óleo °C    | 700ms (pode não ser suportado)|
| 0x46 | Temperatura ambiente °C| 800ms       |
| 0x2F | Nível combustível %    | 800ms       |

### Mode 22 — VW específico (MED17.x)
| DID    | Parâmetro               | Status          |
|--------|-------------------------|-----------------|
| 0x04A2 | Boost turbo alvo kPa    | Verificar no carro |
| 0x04A3 | Boost turbo real kPa    | Verificar no carro |

Marcha calculada via relações reais do Up TSI 5-vel (sem PID dedicado).

## Telas (6 páginas — navegar por toque)

| Tela          | Conteúdo                                        |
|---------------|-------------------------------------------------|
| MAIN          | RPM grande + barra shift + boost + temp + marcha|
| DETAIL        | Carga motor + temp óleo + acelerador + tensão  |
| SENSORS       | MAF + fuel trims + sonda O2 + avanço ignição   |
| GEAR          | Marcha grande + RPM + velocidade                |
| LAUNCH        | Launch control — RPM alvo ajustável por toque  |
| VCDS          | Botões: needle sweep, gauge sweep, coming home, TC|

**Navegação por toque:**
- Qualquer tela: toque esquerda = página anterior, toque direita = próxima
- Tela LAUNCH: toque esquerda/direita ajusta RPM alvo ±100
- Tela VCDS: toque nos 4 quadrantes executa o comando

**Botão TC (GPIO 35):**
- Clique curto: toggle TC ON/OFF (envia frame CAN — preencher após captura)
- Segurar 2s: armar/desarmar launch control → vai para tela LAUNCH

## VCDS Hacks (via UDS/OBD-II)

| Comando       | Serviço UDS | Módulo      | Status              |
|---------------|-------------|-------------|---------------------|
| Needle sweep  | 0x31 (RC)   | Instrumentos| Verificar addr/DID  |
| Gauge sweep   | 0x31 (RC)   | Instrumentos| Verificar addr/DID  |
| Coming home   | 0x2F (IO)   | BCM         | Verificar addr/DID  |
| TC toggle     | CAN direto  | ABS/ESP     | **Pendente captura**|

Os endereços UDS (`UDS_ADDR_*`) e routine IDs precisam de verificação
no carro via VCDS ou OBDeleven antes de usar esses comandos.

## Pendente: frame CAN do TC toggle

Único item que não pode ser implementado sem o carro.

**Procedimento (30 minutos):**
```bash
# 1. Conectar adaptador USB-CAN (CANable, PCAN-USB ~R$80) no OBD-II
# 2. Linux:
sudo ip link set can0 up type can bitrate 500000
candump can0 -l captura.log

# 3. Pressionar botão TC físico do painel UMA VEZ
# 4. Ctrl+C para parar
# 5. Analisar: grep por frames que apareceram exatamente 1x
cantools decode captura.log

# 6. Preencher em firmware/include/config.h:
#define TC_CAN_ID       0xXXX
#define TC_PAYLOAD_ON   {0xXX, 0xXX, ...}
#define TC_PAYLOAD_OFF  {0xXX, 0xXX, ...}
#define TC_PAYLOAD_LEN  N
```

## Build

```bash
pip install platformio
cd firmware
platformio run -t upload    # build + flash
platformio device monitor   # monitor serial
```

## Estrutura do código

```
firmware/
├── include/
│   ├── config.h      ← pinos, thresholds, endereços UDS, Mode22 DIDs
│   ├── obd.h         ← struct OBDData (25 campos) + protótipos
│   └── display.h     ← enum Page + protótipos
└── src/
    ├── obd.cpp       ← leitura OBD escalonada + Mode22 + UDS commands
    ├── display.cpp   ← 6 telas com sprite (sem flickering)
    └── main.cpp      ← loop principal + launch control + touch routing
```
