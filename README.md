flying-monkey
=============
Navigation for 3DR Drones

# Installation

    npm install flying-monkey
    mv node_modules/flying-monkey .
    rmdir node_modules

or alternately clone this repo followed by

    npm install

And then to install the front end components in the flying-monkey directory

    bower install

# API

## Current URL endpoints

The following is accessed via browser at the ip address of the drone.  *http://droneIP:3000/*

* `/map`: gps coordinates embedded in [mapbox](https://www.mapbox.com/) style map.
