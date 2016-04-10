#!/usr/bin/env python

import dronekit
import sys
import time

# Connect to UDP endpoint (and wait for default attributes to accumulate)
def main():
   target = "udpin:0.0.0.0:14550"
   vehicle = dronekit.connect(target,wait_ready=True)
   time.sleep(2)
   vehicle.gimbal.rotate(0,0,0)
   time.sleep(2)
   vehicle.close()
   time.sleep(2)

main()
