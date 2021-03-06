#!/usr/bin/env python

# Example for RC timing reading for Raspberry Pi
# Must be used with GPIO 0.3.1a or later - earlier verions
# are not fast enough!

import RPi.GPIO as GPIO, time, os
import sys

DEBUG = 1
GPIO.setmode(GPIO.BCM)

def RCtime (RCpin):
        reading = 0
        # print "GPIO.LOW: %d" % GPIO.OUT;
        GPIO.setup(RCpin, GPIO.OUT)
        GPIO.output(RCpin, GPIO.LOW)
        time.sleep(0.001)

        GPIO.setup(RCpin, GPIO.IN)
        # This takes about 1 millisecond per loop cycle
        # print "GPIO.input (RCpin): %d" % GPIO.input(RCpin);
        while (GPIO.input(RCpin) == GPIO.LOW):
                reading += 1
        # print "GPIO.input (RCpin): %d" % GPIO.input(RCpin);
        return reading

GPIO.setwarnings(False);
print RCtime(21)     # Read RC timing using pin #18
GPIO.cleanup();


sys.exit();