#!/usr/bin/env python

import math
import json
import Queue
import threading

FRAME_LOCAL_NED = 1
MAV_CMD_CONDITION_YAW = 115
MAV_CMD_DO_SET_ROI = 201
downloaded = False
q = Queue.Queue()

def print_json():
   while True:
      msg = q.get()
      print(json.dumps(msg)) 

t = threading.Thread(target=print_json,args=())
t.daemon = True
t.start()

def attribute_callback(self,attr_name,value):
   if value != None:
      if attr_name == 'location.global_frame':
         q.put({ 'gpsCoords':{ 'lat':value.lat, 'long':value.lon, 'alt':value.alt }})
      elif attr_name == 'attitude':
         q.put({ 'attitude':{ 'value':{'pitch':value.pitch, 'yaw':value.yaw, 'roll':value.roll }}})
      elif attr_name == 'mode': q.put({ 'modeName':value.name })
      elif attr_name == 'armed': q.put({ 'isArmed':value })

def send_ned_velocity(vehicle,vn,ve,vd):
   msg = vehicle.message_factory.set_position_target_local_ned_encode(0,0,0,FRAME_LOCAL_NED,0b0000111111000111,0,0,0,vn,ve,vd,0,0,0,0,0)
   vehicle.send_mavlink(msg)

def condition_yaw(vehicle,heading):
   msg = vehicle.message_factory.command_long_encode(0,0,MAV_CMD_CONDITION_YAW,0,heading,0,1,0,0,0,0)
   vehicle.send_mavlink(msg)

def set_roi(vehicle,latitude,longitude,altitude):
   msg = vehicle.message_factory.command_long_encode(0,0,MAV_CMD_DO_SET_ROI,0,0,0,0,0,latitude,longitude,altitude)
   vehicle.send_mavlink(msg)

def process_command(command,vehicle):
   global downloaded

   x = command.split();
   if x[0] == "arm": vehicle.armed = True
#   elif x[0] == "getAttitude":
#      if vehicle.attitude == None: q.put({ 'attitude':{ 'value':None }})
#      else: q.put({ 'attitude':{ 'value':{ 'pitch':vehicle.attitude.pitch, 'yaw':vehicle.attitude.yaw, 'roll':vehicle.attitude.roll }}})
   elif x[0] == "getGimbal":
      if vehicle.gimbal == None: q.put({ 'gimbal':{ 'value':None }})
      else: q.put({ 'gimbal':{ 'value':vehicle.gimbal.pitch }})
   elif x[0] == "getHomeLocation":
      if not downloaded: 
         cmds = vehicle.commands
         cmds.download()
         cmds.wait_ready()
         downloaded = True
      if vehicle.home_location == None: q.put({ 'homeLocation':{ 'value':None }})
      else: q.put({ 'homeLocation':{ 'value':{ 'lat':vehicle.home_location.lat, 'long':vehicle.home_location.lon, 'alt':vehicle.home_location.alt }}})
   elif x[0] == "getVelocity":
      if vehicle.velocity == None: q.put({ 'velocity':{ 'value':None }})
      else: q.put({ 'velocity':{ 'value':vehicle.velocity }})
   elif x[0] == "goto":
      coord_lat = float(x[1])
      coord_long = float(x[2])
      coord_alt = float(x[3])
      speed = float(x[4])
      cmd_str = "goto " + str(coord_lat) + " " + str(coord_long) + " " + str(coord_alt) + " " + str(speed)
      q.put({ 'cmd':cmd_str })
      a_location = dronekit.LocationGlobal(coord_lat,coord_long,coord_alt)
      vehicle.simple_goto(a_location,groundspeed=speed)
   elif x[0] == "guided":
      vehicle.mode = dronekit.VehicleMode("GUIDED")
      q.put({ 'cmd':'guided' })
   elif x[0] == "launch":
      q.put({ 'cmd':'takeoff' })
      vehicle.simple_takeoff(10)
   elif x[0] == "loiter":
      vehicle.mode = dronekit.VehicleMode("LOITER")
      q.put({ 'cmd':'loiter' })
   elif x[0] == "mode":
      q.put({ 'modeName':vehicle.mode.name })
   elif x[0] == "rotateGimbal":
      pitch = float(x[1])
      cmd_str = "gimbal " + str(pitch)
      vehicle.gimbal.rotate(pitch,0,0)
      q.put({ 'cmd':cmd_str })
   elif x[0] == "rtl":
      vehicle.mode = dronekit.VehicleMode("RTL")
      q.put({ 'cmd':'rtl' })
   elif x[0] == "setROI":
      latitude = float(x[1])
      longitude = float(x[2])
      altitude = float(x[3])
      cmd_str = "roi " + str(latitude) + " " + str(longitude) + " " + str(altitude)
      q.put({ 'cmd':cmd_str })
      if not math.isnan(latitude) and not math.isnan(longitude) and not math.isnan(altitude): set_roi(vehicle,latitude,longitude,altitude)
   elif x[0] == "setVelocity":
      vn = float(x[1])
      ve = float(x[2])
      vd = float(x[3])
      cmd_str = "velocity " + str(vn) + " " + str(ve) + " " + str(vd)
      q.put({ 'cmd':cmd_str })
      if not math.isnan(vn) and not math.isnan(ve) and not math.isnan(vd): send_ned_velocity(vehicle,vn,ve,vd)
   elif x[0] == "setYaw":
      heading = float(x[1])
      cmd_str = "yaw " + str(heading)
      q.put({ 'cmd':cmd_str })
      if not math.isnan(heading): condition_yaw(vehicle,heading)
   elif x[0] == "stabilize":
      vehicle.mode = dronekit.VehicleMode("STABILIZE")
      q.put({ 'cmd':'stabilize' })

# Connect to UDP endpoint (and wait for default attributes to accumulate)
def main():
   target = "udpin:0.0.0.0:14550"
   vehicle = dronekit.connect(target)
   q.put({ 'isConnected':True })
   vehicle.add_attribute_listener('location.global_frame',attribute_callback)
   vehicle.add_attribute_listener('mode',attribute_callback)
   vehicle.add_attribute_listener('armed',attribute_callback)
   vehicle.add_attribute_listener('attitude',attribute_callback)
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
   q.put({ 'isConnected':False })
