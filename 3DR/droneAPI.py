#!/usr/bin/env python

def gps_callback(self, attr_name, value):
  if value != None:
     print(json.dumps({ 'gpsCoords':{ 'lat':value.lat, 'long':value.lon, 'alt':value.alt }}))

def process_command(command,vehicle):
   print(json.dumps({ 'cmd':command }))
   x = command.split();
   if x[0] == "goto":
      a_location = dronekit.LocationGlobal(float(x[1]),float(x[2]),float(x[3]))
      vehicle.simple_goto(a_location)

# Connect to UDP endpoint (and wait for default attributes to accumulate)
def main():
   target = "udpin:0.0.0.0:14550"
   vehicle = dronekit.connect(target,wait_ready=True)
   vehicle.add_attribute_listener('location.global_frame', gps_callback)
   while 1:
      line = ""
      for c in raw_input():
         line = line + c
      process_command(line,vehicle)
   vehicle.close()

try:
   import dronekit
   import sys
   import json
   main()
except ImportError:
   pass
