#!/usr/bin/env python

def gps_callback(self, attr_name, value):
   if value != None:
      print json.dumps({ 'lat':value.lat, 'long':value.lon, 'alt':value.alt })

def process_command(command):
    print(command)

# Connect to UDP endpoint (and wait for default attributes to accumulate)
def main():
   target = "udpin:0.0.0.0:14550"
   vehicle = dronekit.connect(target,wait_ready=True)
   vehicle.add_attribute_listener('location.global_frame', gps_callback)
   for line in sys.stdin: process_command(line)
   vehicle.close()

try:
   import dronekit
   import sys
   import json
   main()
except ImportError:
   pass
