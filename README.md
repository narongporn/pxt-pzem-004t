# PZEM-004T v3.0 Extension for micro:bit

This extension adds support for the PZEM-004T v3.0 energy monitor via Modbus RTU.

## Wiring
- PZEM TX → micro:bit RX (e.g., P1)
- PZEM RX → micro:bit TX (e.g., P0)
- Baudrate: 9600

## Blocks
- Initialize with TX/RX pins
- Read voltage, current, power, energy, frequency, power factor
- Reset energy
- Set custom Modbus address

## Example
```typescript
pzem.init(SerialPin.P0, SerialPin.P1)
basic.forever(function () {
    serial.writeLine("Voltage: " + pzem.voltage() + " V")
    serial.writeLine("Current: " + pzem.current() + " A")
})
