# Dashboard Up TSI — Contexto do Projeto

## O que é este projeto

Recriação do dashboard TDL EVO Street 3.5" (ProTune) do zero, para VW Up TSI Pepper com Composition Colour.
Construído em ESP32 + ILI9488 3.5" touchscreen + CAN bus via SN65HVD230.

## Hardware alvo

- VW Up! TSI Pepper (motor CHY/CHZ, câmbio ASG 5-vel)
- Composition Colour (mídia original com todos os opcionais)
- Substitui: TDL EVO Street 3.5" (ProTune) + "The Dash"

## Hardware do dispositivo

| Componente      | Modelo                 |
|-----------------|------------------------|
| MCU             | ESP32 DevKit v1        |
| Transceiver CAN | SN65HVD230 (3.3V)      |
| Display         | ILI9488 3.5" SPI touch |
| Touch           | XPT2046 (integrado)    |

### Pinagem ESP32

| Função    | GPIO |
|-----------|------|
| CAN TX    | 21   |
| CAN RX    | 22   |
| TFT CS    | 15   |
| TFT DC    | 2    |
| TFT RST   | 4    |
| TFT MOSI  | 23   |
| TFT MISO  | 19   |
| TFT CLK   | 18   |
| TFT BL    | 32   |
| Touch CS  | 33   |
| Botão TC  | 35   |

## Estado atual do firmware (v2 — branch claude/pwa-app-reference-3yglas)

### O que está implementado e funcionando

**17 PIDs ativos** com ciclo escalonado (rápidos a 100ms, lentos a 2s):
- RPM, velocidade, coolant temp, intake temp, throttle, MAP/boost
- Carga motor, MAF g/s, fuel trim ST/LT, avanço ignição
- Sonda O2 narrowband (PID 0x14), temperatura óleo, temperatura ambiente, nível combustível
- Tensão bateria

**Mode 22 VW automático**: tenta PIDs proprietários 0x04A2/0x04A3 (boost turbo alvo/real); fallback para MAP se o ECU não suportar. Flag `data.mode22_ok` indica qual está ativo.

**6 telas navegáveis por toque:**
- MAIN: RPM grande + barra shift light + boost + coolant + marcha calculada
- DETAIL: carga motor + temperatura óleo + throttle + tensão
- SENSORS: MAF + fuel trims + sonda O2 + avanço ignição
- GEAR: indicador de marcha grande
- LAUNCH: launch control — RPM alvo ajustável por toque
- VCDS: botões para needle sweep, gauge sweep, coming home, TC toggle

**Launch Control:**
- Segurar botão TC (GPIO 35) por 2s → arma launch → vai para tela LAUNCH
- Clique curto → toggle TC on/off
- Toque esquerda/direita na tela LAUNCH ajusta RPM alvo ±100 (padrão 3500 RPM)
- Desarma automaticamente se speed > 10 km/h e RPM < 800

**Camada UDS (ISO-TP single-frame):**
- `obd_cmd_needle_sweep()` — UDS 0x31 para módulo de instrumentos
- `obd_cmd_gauge_sweep()` — UDS 0x31 para módulo de instrumentos
- `obd_cmd_coming_home()` — UDS 0x2F para BCM
- Endereços físicos em `config.h` (`UDS_ADDR_*`) — precisam de verificação no carro

**Marcha calculada** via relações reais do Up TSI ASG 5-vel (sem PID dedicado no ECU).

### Único item pendente: frame CAN do TC toggle

O TC toggle manda um frame CAN direto no barramento OBD-II quando o botão é pressionado.
Precisa capturar esse frame com o carro ligado.

**As constantes estão em `firmware/include/config.h`:**
```cpp
#define TC_CAN_ID       0x000        // <<< PREENCHER após sniffing
#define TC_PAYLOAD_ON   {0x00}       // <<< PREENCHER após sniffing
#define TC_PAYLOAD_OFF  {0x00}       // <<< PREENCHER após sniffing
#define TC_PAYLOAD_LEN  1            // <<< PREENCHER após sniffing
```

**Procedimento de captura (30 min, Linux/WSL2):**
```bash
# Conectar adaptador USB-CAN (CANable ou similar ~R$80) no OBD-II do Up
sudo ip link set can0 up type can bitrate 500000
candump can0 -l captura.log
# Pressionar o botão TC físico do painel UMA vez
# Ctrl+C para parar
# Analisar frames únicos:
grep -v "$(sort captura.log | uniq -d)" captura.log
```

## Estrutura do código

```
firmware/
├── platformio.ini         ← build config (ESP32 + TFT_eSPI)
├── include/
│   ├── config.h           ← pinos, thresholds, endereços UDS, TC frame
│   ├── obd.h              ← struct OBDData (25 campos) + protótipos
│   └── display.h          ← enum Page (6 telas) + protótipos
└── src/
    ├── obd.cpp            ← leitura OBD escalonada + Mode22 + UDS commands
    ├── display.cpp        ← 6 telas com sprite TFT (sem flickering)
    └── main.cpp           ← loop principal + launch control + touch routing
```

## Como buildar

```bash
pip install platformio
cd firmware
pio run              # só compilar
pio run -t upload    # compilar + flashar (ESP32 via USB)
pio device monitor   # serial 115200 baud
```

Ou usar a extensão PlatformIO no VS Code.

## Conhecimento técnico acumulado

### CAN bus do Up TSI
- OBD-II CAN a 500 kbps
- OBD-II pinos 6 (CAN-H) e 14 (CAN-L)
- ECU motor: CAN ID físico 0x7E0 (confirmado via análise do firmware ProTune)
- OBD-II broadcast: 0x7DF / resposta: 0x7E8

### Firmware ProTune (análise feita nesta sessão)
- Arquivo .FRW: 8.240 blocos de 512 bytes cifrados com XOR (chave 59 bytes)
- Estrutura: header `2a [BLK_HI] [BLK_LO] b4 88` + 507 bytes de bytecode proprietário
- Número do bloco = CAN ID (confirmado: bloco 0x7E0, 0x7DF, 0x7E8, 0x1CA, etc.)
- Conteúdo interno é bytecode proprietário, não ARM binário

### PIDs VW Mode 22 (a verificar no carro)
- `0x04A2`: boost turbo alvo (0.1 kPa/bit)
- `0x04A3`: boost turbo real (0.1 kPa/bit)
- `0x04C1`: temperatura óleo estimada pelo ECU
- Verificar via VCDS → Módulo 01 → Grupos de medição

### UDS endereços físicos (a verificar no carro)
- `0x7E0`: ECU motor (confirmado)
- `0x7A0`: ABS/ESP — verificar
- `0x760`: Painel de instrumentos — verificar
- `0x765`: BCM (conforto) — verificar

## Próximos passos

1. **Imediato**: capturar frame CAN do TC toggle (precisa do carro + adaptador USB-CAN)
2. **No carro**: verificar quais PIDs Mode 22 o ECU realmente responde
3. **No carro**: confirmar endereços UDS dos módulos via VCDS/OBDeleven
4. **Ajustar**: routine IDs reais para needle sweep e coming home após confirmar módulos
