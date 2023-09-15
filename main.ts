/**
* LCD1602 Screen Functions
*/

//% weight=0 color=#166b42 icon="\uf108" block=" LCD1602"
namespace lcd1602 {
    export let LCD_I2C_ADDR = 0x3f
    let buf = 0x00
    let BK = 0x08
    let RS = 0x00
    let E = 0x04

    function setReg(dat: number): void {
        pins.i2cWriteNumber(LCD_I2C_ADDR, dat, NumberFormat.UInt8BE, false)
        basic.pause(1)
    }

    function send(dat: number): void {
        let d = dat & 0xF0
        d |= BK
        d |= RS
        setReg(d)
        setReg(d | 0x04)
        setReg(d)
    }

    function setcmd(cmd: number): void {
        RS = 0
        send(cmd)
        send(cmd << 4)
    }

    function setdat(dat: number): void {
        RS = 1
        send(dat)
        send(dat << 4)
    }

    export enum I2C_ADDR {
        //% block="0x27"
        addr1 = 0x27,
        //% block="0x3f"
        addr2 = 0x3f,
        //% block="0x20"
        addr3 = 0x20,
        //% block="0x62"
        addr4 = 0x62,
        //% block="0x3e"
        addr5 = 0x3e
    }
    export enum on_off {
        //% block="on"
        on = 1,
        //% block="off"
        off = 0
    }

    export enum visibled {
        //% block="visible"
        visible = 1,
        //% block="invisible"
        invisible = 0
    }

    function setI2CAddress(): void {
        setcmd(0x33)
        basic.pause(5)
        send(0x30)
        basic.pause(5)
        send(0x20)
        basic.pause(5)
        setcmd(0x28)
        setcmd(0x0C)
        setcmd(0x06)
        setcmd(0x01)
    } 

    /**
     * Sets the I2C address
     */
    //% blockId="LCD_setAddress" block="Set I2C address %myAddr"
    //% weight=52 blockExternalInputs=true
    export function setAddress(myAddr: I2C_ADDR): void {
        LCD_I2C_ADDR = myAddr
        setI2CAddress()
    }

    /**
     * Sets the numeric I2C address
     */
    //% blockId="LCD_setAddress2" block="Set Numeric I2C Address %myAddr"
    //% weight=51 blockExternalInputs=true
    export function setAddress2(myAddr: number): void {
        LCD_I2C_ADDR = myAddr
        setI2CAddress()
    }

    // Auto Set I2C Address
    function AutoAddr() {
        let k = true
        let addr = 0x20
        let d1 = 0, d2 = 0
        while (k && (addr < 0x28)) {
            pins.i2cWriteNumber(addr, -1, NumberFormat.Int32LE)
            d1 = pins.i2cReadNumber(addr, NumberFormat.Int8LE) % 16
            pins.i2cWriteNumber(addr, 0, NumberFormat.Int16LE)
            d2 = pins.i2cReadNumber(addr, NumberFormat.Int8LE)
            if ((d1 == 7) && (d2 == 0)) k = false
            else addr += 1
        }
        if (!k) return addr
         addr = 0x38
        while (k && (addr < 0x40)) {
            pins.i2cWriteNumber(addr, -1, NumberFormat.Int32LE)
            d1 = pins.i2cReadNumber(addr, NumberFormat.Int8LE) % 16
            pins.i2cWriteNumber(addr, 0, NumberFormat.Int16LE)
            d2 = pins.i2cReadNumber(addr, NumberFormat.Int8LE)
            if ((d1 == 7) && (d2 == 0)) k = false
            else addr += 1
        }
        if (!k) return addr
        else return 0
    }

    /**
     * Automatically sets the I2C address
     */
    //% blockId="LCD_setAddress3" block="Auto Set I2C Address"
    //% weight=50
    export function setAddress3(): void {
        LCD_I2C_ADDR = AutoAddr()
        setI2CAddress()
    }

    /**
     * Clears the screen
     */
    //% blockId="LCD_clear" block="Clear Screen"
    //% weight=45
    export function clear(): void {
        setcmd(0x01)
    }

    /**
     * Set the backlight to on or off
     */
    //% blockId="LCD_backlight" block="Set Backlight %on"
    //% weight=46
    export function set_backlight(on: on_off): void {
        if (on == 1)
            BK = 0x08
        else
            BK = 0x00
        setcmd(0x00)
    }

    /**
     * Set the string to visible or invisible
     */
    //% blockId="LCD_Show" block="Set String %show"
    //% weight=47
    export function set_LCD_Show(show: visibled): void {
        if (show == 1)
            setcmd(0x0C)
        else
            setcmd(0x08)
    }

    function printChar(ch: number, x: number, y: number): void {
        if (x >= 0) {
            let a = 0x80
            if (y == 1)
                a = 0xC0
	    if (y == 2)
                a = 0x80 + 0x14
            if (y == 3)
                a = 0xC0 + 0x14
            a += x
            setcmd(a)
        }
        setdat(ch)
    }

    /**
     * Display a string on the screen
     */
    //% blockId="LCD_putString" block="Show String %s|X:%x|Y:%y"
    //% weight=49 blockExternalInputs=true x.min=0 x.max=15 y.min=0 y.max=1
    export function putString(s: string, x: number, y: number): void {
        if (s.length > 0) {
            let breakPoint = -1
            printChar(s.charCodeAt(0), x, y)
            if (y == 0)
                breakPoint = 16 - x
            for (let i = 1; i < s.length; i++) {
                if (i == breakPoint)
                    printChar(s.charCodeAt(i), 0, 1)
                else
                    printChar(s.charCodeAt(i), -1, 0)
            }
        }
    }
	
    /**
     * Display a number on the screen
     */
    //% blockId="LCD_putNumber" block="Show Number %n|X:%x|Y:%y"
    //% weight=48 blockExternalInputs=true x.min=0 x.max=15 y.min=0 y.max=1
    export function putNumber(n: number, x: number, y: number): void {
        putString(n.toString(),x,y)
    }

    /**
     * Shift the screen to the left
     */
    //% blockId="LCD_shl" block="Shift Left"
    //% weight=43
    export function shl(): void {
        setcmd(0x18)
    }

    /**
     * Shift the screen to the right
     */
    //% blockId="LCD_shr" block="Shift Right"
    //% weight=42
    export function shr(): void {
        setcmd(0x1C)
    }
}
