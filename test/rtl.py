#!/usr/bin/env python

import dronekit
import sys

# Connect to UDP endpoint (and wait for default attributes to accumulate)
def main():
   target = "udpin:0.0.0.0:14550"
   vehicle = dronekit.connect(target,wait_ready=True)
   vehicle.mode = dronekit.VehicleMode("RTL")
   vehicle.close()

main()
