#!/usr/bin/env python

from dronekit import connect
import sys
import json

# Connect to UDP endpoint (and wait for default attributes to accumulate)
target = "udpin:0.0.0.0:14550"
vehicle = connect(target,wait_ready=True)

def gps_callback(self, attr_name, value):
   if value != None:
      print json.dumps({ 'lat':value.lat, 'long':value.lon, 'alt':value.alt })

vehicle.add_attribute_listener('location.global_frame', gps_callback)
sys.stdin.read()
vehicle.close()
