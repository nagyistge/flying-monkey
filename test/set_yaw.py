#!/usr/bin/env python

import dronekit
import time
import sys

MAV_CMD_CONDITION_YAW = 115

def condition_yaw(vehicle,heading):
   msg = vehicle.message_factory.command_long_encode(0,0,MAV_CMD_CONDITION_YAW,0,heading,0,1,0,0,0,0)
   vehicle.send_mavlink(msg)

# Connect to UDP endpoint (and wait for default attributes to accumulate)
def main():
   target = "udpin:0.0.0.0:14550"
   vehicle = dronekit.connect(target,wait_ready=True)
   vehicle.mode = dronekit.VehicleMode("GUIDED")
   time.sleep(2)
   condition_yaw(vehicle,180);
   vehicle.close()

main()
