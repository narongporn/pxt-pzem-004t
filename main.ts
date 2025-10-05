// MakeCode extension for PZEM-004T v3.0 Energy Monitor
// Based on Arduino library by mandulaj (https://github.com/mandulaj/PZEM-004T-v30)

namespace PZEM004T {
    let address = 0xF8 // Default broadcast address

    // Modbus function codes
    const READ_INPUT_REGISTER = 0x04
    const READ_HOLDING_REGISTER = 0x03
    const WRITE_SINGLE_REGISTER = 0x06
    const WRITE_MULTIPLE_REGISTERS = 0x10

    // Register map from official Arduino library
    const REG_VOLTAGE     = 0x0000 // 2 bytes, 0.1 V
    const REG_CURRENT     = 0x0001 // 4 bytes, 0.001 A
    const REG_POWER       = 0x0003 // 4 bytes, 0.1 W
    const REG_ENERGY      = 0x0005 // 4 bytes, 1 Wh
    const REG_FREQUENCY   = 0x0007 // 2 bytes, 0.1 Hz
    const REG_PF          = 0x0008 // 2 bytes, 0.01
    const REG_ALARM       = 0x0009 // 2 bytes

    // Commands for special functions
    const CMD_SET_ADDRESS = 0x06
    const CMD_RESET_ENERGY = 0x42

    // Serial pins (to be set by user)
    let txPin: SerialPin
    let rxPin: SerialPin

    function crc16(buffer: Buffer, len: number): number {
        let crc = 0xFFFF
        for (let pos = 0; pos < len; pos++) {
            crc ^= buffer[pos]
            for (let i = 0; i < 8; i++) {
                if ((crc & 0x0001) != 0) {
                    crc >>= 1
                    crc ^= 0xA001
                } else {
                    crc >>= 1
                }
            }
        }
        return crc
    }

    function sendCommandRaw(buf: Buffer, len: number) {
        let crc = crc16(buf, len - 2)
        buf[len - 2] = crc & 0xFF
        buf[len - 1] = (crc >> 8) & 0xFF
        serial.writeBuffer(buf)
    }

    function sendCommand(func: number, reg: number, count: number): Buffer {
        let buf = pins.createBuffer(8)
        buf[0] = address
        buf[1] = func
        buf[2] = (reg >> 8) & 0xFF
        buf[3] = reg & 0xFF
        buf[4] = (count >> 8) & 0xFF
        buf[5] = count & 0xFF
        let crc = crc16(buf, 6)
        buf[6] = crc & 0xFF
        buf[7] = (crc >> 8) & 0xFF
        serial.writeBuffer(buf)
        return buf
    }

    function readResponse(length: number): Buffer {
        basic.pause(200)
        let res = serial.readBuffer(length)
        return res
    }

    function readRegister(reg: number, words: number): number {
        sendCommand(READ_INPUT_REGISTER, reg, words)
        let res = readResponse(5 + 2 * words)
        if (res.length < 5) return 0
        let val = 0
        for (let i = 0; i < res[2]; i++) {
            val = (val << 8) | res[3 + i]
        }
        return val
    }

    /**
     * Initialize PZEM communication
     */
    //% block="init PZEM TX %tx RX %rx"
    export function init(tx: SerialPin, rx: SerialPin): void {
        txPin = tx
        rxPin = rx
        serial.redirect(rxPin, txPin, BaudRate.BaudRate9600)
        basic.pause(100)
    }

    /** Set custom Modbus address */
    //% block="set PZEM address %newAddr"
    export function setAddress(newAddr: number): void {
        let buf = pins.createBuffer(8)
        buf[0] = address
        buf[1] = WRITE_SINGLE_REGISTER
        buf[2] = 0x00
        buf[3] = 0x02 // Address register
        buf[4] = 0x00
        buf[5] = newAddr & 0xFF
        sendCommandRaw(buf, 8)
        address = newAddr
    }

    /** Reset energy counter */
    //% block="reset PZEM energy"
    export function resetEnergy(): void {
        let buf = pins.createBuffer(8)
        buf[0] = address
        buf[1] = CMD_RESET_ENERGY
        buf[2] = 0x00
        buf[3] = 0x00
        buf[4] = 0x00
        buf[5] = 0x00
        sendCommandRaw(buf, 8)
    }

    /** Get voltage in Volts */
    //% block
    export function voltage(): number {
        return readRegister(REG_VOLTAGE, 1) / 10.0
    }

    /** Get current in Amperes */
    //% block
    export function current(): number {
        return readRegister(REG_CURRENT, 2) / 1000.0
    }

    /** Get active power in Watts */
    //% block
    export function power(): number {
        return readRegister(REG_POWER, 2) / 10.0
    }

    /** Get energy in Wh */
    //% block
    export function energy(): number {
        return readRegister(REG_ENERGY, 2)
    }

    /** Get frequency in Hz */
    //% block
    export function frequency(): number {
        return readRegister(REG_FREQUENCY, 1) / 10.0
    }

    /** Get power factor */
    //% block
    export function powerFactor(): number {
        return readRegister(REG_PF, 1) / 100.0
    }
}
