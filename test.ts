pzem.init(SerialPin.P0, SerialPin.P1)

basic.forever(function () {
    serial.writeLine("Voltage: " + pzem.voltage() + " V")
    serial.writeLine("Current: " + pzem.current() + " A")
    serial.writeLine("Power: " + pzem.power() + " W")
    serial.writeLine("Energy: " + pzem.energy() + " Wh")
    serial.writeLine("Frequency: " + pzem.frequency() + " Hz")
    serial.writeLine("Power Factor: " + pzem.powerFactor())
    basic.pause(2000)
})
