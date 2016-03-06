#!/usr/bin/env python

FRAME_LOCAL_NED = 1

def attribute_callback(self,attr_name,value):
  if value != None:
     if attr_name == 'location.global_frame':
        print(json.dumps({ 'gpsCoords':{ 'lat':value.lat, 'long':value.lon, 'alt':value.alt }}))
     elif attr_name == 'mode': print(json.dumps({ 'modeName':value.name }))
     elif attr_name == 'armed': print(json.dumps({ 'isArmed':value }))

def send_ned_velocity(vehicle,vn,ve,vd):
   msg = vehicle.message_factory.set_position_target_local_ned_encode(0,0,0,FRAME_LOCAL_NED,0b0000111111000111,0,0,0,vn,ve,vd,0,0,0,0,0)
   vehicle.send_mavlink(msg)

def process_command(command,vehicle):
   x = command.split();
   if x[0] == "goto":
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
   elif x[0] == "rtl":
      vehicle.mode = dronekit.VehicleMode("RTL")
      print(json.dumps({ 'cmd':'rtl' }))
   elif x[0] == "loiter":
      vehicle.mode = dronekit.VehicleMode("LOITER")
      print(json.dumps({ 'cmd':'loiter' }))
   elif x[0] == "mode":
      print(json.dumps({ 'modeName':vehicle.mode.name }))
   elif x[0] == "setVelocity":
      vn = float(x[1])
      ve = float(x[2])
      vd = float(x[3])
      cmd_str = "velocity " + str(vn) + " " + str(ve) + " " + str(vd)
      print(json.dumps({ 'cmd':cmd_str }))
      send_ned_velocity(vehicle,vn,ve,vd)



# Connect to UDP endpoint (and wait for default attributes to accumulate)
def main():
   target = "udpin:0.0.0.0:14550"
   vehicle = dronekit.connect(target,wait_ready=True)
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
   import json
   main()
except ImportError:
   pass
