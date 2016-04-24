#!/usr/bin/env python

import math
import json

FRAME_LOCAL_NED = 1
MAV_CMD_CONDITION_YAW = 115
downloaded = False

def attribute_callback(self,attr_name,value):
  if value != None:
     if attr_name == 'location.global_frame':
        print(json.dumps({ 'gpsCoords':{ 'lat':value.lat, 'long':value.lon, 'alt':value.alt }}))
     elif attr_name == 'mode': print(json.dumps({ 'modeName':value.name }))
     elif attr_name == 'armed': print(json.dumps({ 'isArmed':value }))

def send_ned_velocity(vehicle,vn,ve,vd):
   msg = vehicle.message_factory.set_position_target_local_ned_encode(0,0,0,FRAME_LOCAL_NED,0b0000111111000111,0,0,0,vn,ve,vd,0,0,0,0,0)
   vehicle.send_mavlink(msg)

def condition_yaw(vehicle,heading):
   msg = vehicle.message_factory.command_long_encode(0,0,MAV_CMD_CONDITION_YAW,0,heading,0,1,0,0,0,0)
   vehicle.send_mavlink(msg)

def process_command(command,vehicle):
   global downloaded

   x = command.split();
   if x[0] == "arm": vehicle.armed = True
   elif x[0] == "getAttitude":
      print(json.dumps({ 'attitude':vehicle.attitude }))
   elif x[0] == "getGimbal":
      print(json.dumps({ 'gimbal':vehicle.gimbal.pitch }))
   elif x[0] == "getHomeLocation":
      if not downloaded: 
         cmds = vehicle.commands
         cmds.download()
         cmds.wait_ready()
         downloaded = True
      if vehicle.home_location == None: print(json.dumps({ 'homeLocation':None }))
      else: print(json.dumps({ 'homeLocation':{ 'lat':vehicle.home_location.lat, 'long':vehicle.home_location.lon, 'alt':vehicle.home_location.alt }}))
   elif x[0] == "getVelocity":
      print(json.dumps({ 'velocity':vehicle.velocity }))
   elif x[0] == "goto":
      coord_lat = float(x[1])
      coord_long = float(x[2])
      coord_alt = float(x[3])
      speed = float(x[4])
      cmd_str = "goto " + str(coord_lat) + " " + str(coord_long) + " " + str(coord_alt) + " " + str(speed)
      print(json.dumps({ 'cmd':cmd_str }))
      a_location = dronekit.LocationGlobal(coord_lat,coord_long,coord_alt)
      vehicle.simple_goto(a_location,groundspeed=speed)
   elif x[0] == "guided":
      vehicle.mode = dronekit.VehicleMode("GUIDED")
      print(json.dumps({ 'cmd':'guided' }))
   elif x[0] == "launch":
      vehicle.simple_takeoff(10)
   elif x[0] == "loiter":
      vehicle.mode = dronekit.VehicleMode("LOITER")
      print(json.dumps({ 'cmd':'loiter' }))
   elif x[0] == "mode":
      print(json.dumps({ 'modeName':vehicle.mode.name }))
   elif x[0] == "rotateGimbal":
      pitch = float(x[1])
      cmd_str = "gimbal " + str(pitch)
      vehicle.gimbal.rotate(pitch,0,0)
      print(json.dumps({ 'cmd':cmd_str }))
   elif x[0] == "rtl":
      vehicle.mode = dronekit.VehicleMode("RTL")
      print(json.dumps({ 'cmd':'rtl' }))
   elif x[0] == "setVelocity":
      vn = float(x[1])
      ve = float(x[2])
      vd = float(x[3])
      cmd_str = "velocity " + str(vn) + " " + str(ve) + " " + str(vd)
      print(json.dumps({ 'cmd':cmd_str }))
      if not math.isnan(vn) and not math.isnan(ve) and not math.isnan(vd): send_ned_velocity(vehicle,vn,ve,vd)
   elif x[0] == "setYaw":
      heading = float(x[1])
      cmd_str = "yaw " + str(heading)
      print(json.dumps({ 'cmd':cmd_str }))
      if not math.isnan(heading): condition_yaw(vehicle,heading)
   elif x[0] == "stabilize":
      vehicle.mode = dronekit.VehicleMode("STABILIZE")
      print(json.dumps({ 'cmd':'stabilize' }))

# Connect to UDP endpoint (and wait for default attributes to accumulate)
def main():
   target = "udpin:0.0.0.0:14550"
   #vehicle = dronekit.connect(target,wait_ready=True)
   vehicle = dronekit.connect(target)
   print(json.dumps({ 'isConnected':True }))
   vehicle.add_attribute_listener('location.global_frame',attribute_callback)
   vehicle.add_attribute_listener('mode',attribute_callback)
   vehicle.add_attribute_listener('armed',attribute_callback)
   while 1:
      line = ""
      for c in raw_input():
         line = line + c
      process_command(line,vehicle)
   vehicle.close()

try:
   import dronekit
   import sys
   main()
except ImportError:
   print(json.dumps({ 'isConnected':False }))
