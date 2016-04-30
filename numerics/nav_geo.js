"use strict";

function norm(v)
{
   return Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
}

function dot(a,b)
{
   return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}

function earthRadius(lat)
{
  let a =  6378137.0;
  let b =  6356752.3;
  let phi = lat*Math.PI/180;

  return Math.sqrt((Math.pow(a*a*Math.cos(phi),2) + Math.pow(b*b*Math.sin(phi),2))/(Math.pow(a*Math.cos(phi),2) + Math.pow(b*Math.sin(phi),2)));
}

module.exports =
{
  cosineSimilarity: function(a,b)
  {
    return dot(a,b)/(norm(a)*norm(b));
  },
  deltaF1: function(args)
  {
    let r = args[0];
    let theta = args[1];
    let s = args[2];
    let gradient = [];

    gradient[0] = -2*r*(s/(s + 1)*Math.exp(-2*r/(s + 1))*(2 - 0.5*cos(theta + Math.PI)) + 2*Math.exp(-0.25*r*r)) + 1;
    gradient[1] = 0.5*s*Math.exp(-2*r/(s + 1))*Math.sin(theta);
    return gradient;
  },
  deltaF2: function(args)
  {
    let gradient = [];
    let r = args[0];
    let theta = args[1];
    let s = args[2];
    let denom = Math.abs(r - s*(2*Math.cos(theta) + 5));
    let dtheta = (2*s*Math.sin(theta)*(r - s*(2*Math.cos(theta) + 5)))/denom + r/4*Math.sin(theta);
    let dr = (r - 2*s*Math.cos(theta) - 5*s)/denom - Math.cos(theta)/4;

    gradient[0] = Math.cos(theta)*dr - 1/r*Math.sin(theta)*dtheta;
    gradient[1] = Math.sin(theta)*dr + 1/r*Math.cos(theta)*dtheta;
    return gradient;
  },
  maelstorm: function(args)
  {
    let gradient = [];
    let r = args[0];
    let theta = args[1];
    let s = args[2];
    let phi = args[3];
    let x = r*Math.cos(theta);
    let y = r*Math.sin(theta);
    let p = s + 1.5;

    if(p < 2.5) p = 2.5;

    let ux = 0.65*p*x/norm([x,y,0]);
    let uy = 0.65*p*y/norm([x,y,0]);
    let a = 2.9*p;
    let ex = (x/a)*(x/a);
    let ey = (y/a)*(y/a);
    let f = Math.PI/(1 + Math.exp(-(1 - Math.sqrt(ex + ey))));
    let l = (theta - phi) % (2*Math.PI);

    //if(l < 0) l += 2*Math.PI;
    //if(l < 0.1
    //if(l > Math.PI) f = -1*f;
    //gradient[0] = (ux*Math.cos(f) - uy*Math.sin(f)) - s*(0.5 - 0.5*Math.cos(-phi))*Math.cos(phi);
    //gradient[1] = (ux*Math.sin(f) + uy*Math.cos(f)) - s*(0.5 - 0.5*Math.cos(-phi))*Math.sin(phi);
    gradient[0] = (ux*Math.cos(f) - uy*Math.sin(f)) - s*Math.cos(phi);
    gradient[1] = (ux*Math.sin(f) + uy*Math.cos(f)) - s*Math.sin(phi);
    return gradient;
  },
  destination: function(args)
  {
    let res = [];
    let srcLat = args[0]*Math.PI/180;
    let srcLong = args[1]*Math.PI/180;
    let azmuth = args[2];
    let distanceInMeters = args[3];
    let distanceInRadians = distanceInMeters/earthRadius(args[0]);
    let destLat = Math.asin(Math.sin(srcLat)*Math.cos(distanceInRadians) + Math.cos(srcLat)*Math.sin(distanceInRadians)*Math.cos(azmuth));
    let dlong = srcLong + Math.atan2(Math.sin(azmuth)*Math.sin(distanceInRadians)*Math.cos(srcLat),Math.cos(distanceInRadians) - Math.sin(srcLat)*Math.sin(destLat));
    let destLong = (dlong + 3*Math.PI) % (2*Math.PI) - Math.PI;

    res[0] = destLat*180/Math.PI;
    res[1] = destLong*180/Math.PI;
    return res;
  },
  forwardAzmuth: function(args)
  {
    let lat1 = args[0];
    let long1 = args[1];
    let lat2 = args[2];
    let long2 = args[3];
    let phi1 = lat1*Math.PI/180;
    let phi2 = lat2*Math.PI/180;
    let lam1 = long1*Math.PI/180;
    let lam2 = long2*Math.PI/180;
    let x = Math.sin(lam2 - lam1)*Math.cos(phi2);
    let y = Math.cos(phi1)*Math.sin(phi2) - Math.sin(phi1)*Math.cos(phi2)*Math.cos(lam2 - lam1);

    return Math.atan2(x,y) % (2*Math.PI);
  },
  haversine: function(args)
  {
    let lat1 = args[0];
    let long1 = args[1];
    let lat2 = args[2];
    let long2 = args[3];
    let phi1 = lat1*Math.PI/180;
    let phi2 = lat2*Math.PI/180;
    let lam1 = long1*Math.PI/180;
    let lam2 = long2*Math.PI/180;


    return 2*earthRadius(lat1)*Math.asin(Math.sqrt(Math.pow(Math.sin((phi2 - phi1)/2),2) + Math.cos(phi1)*Math.cos(phi2)*Math.pow(Math.sin((lam2 - lam1)/2),2)));
  },
  speed: function(x)
  {
    return 7*(2/(1 + Math.exp(-Math.pow(Math.abs(x/10),5/4))) - 1);
  }
}
