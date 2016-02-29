#!/usr/bin/env python

import dronekit
import sys

# Connect to UDP endpoint (and wait for default attributes to accumulate)
def main():
   target = "udpin:0.0.0.0:14550"
   vehicle = dronekit.connect(target,wait_ready=True)
   vehicle.mode = dronekit.VehicleMode("GUIDED")
   a_location = dronekit.LocationGlobal(35.80004274469795, -78.77133535151027, 154.3443094818955)
   vehicle.simple_goto(a_location,groundspeed=2.0)
   vehicle.close()

main()
