#!/usr/bin/env python

def doImport():
   try:
      from dronekit import connect
      import sys
      import json
      return True;
   except ImportError:
      return False;

def gps_callback(self, attr_name, value):
   if value != None:
      print json.dumps({ 'lat':value.lat, 'long':value.lon, 'alt':value.alt })

# Connect to UDP endpoint (and wait for default attributes to accumulate)
def main():
   if doImport():
      target = "udpin:0.0.0.0:14550"
      vehicle = connect(target,wait_ready=True)
      vehicle.add_attribute_listener('location.global_frame', gps_callback)
      sys.stdin.read()
      vehicle.close()

main()
