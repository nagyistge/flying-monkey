module nav_geo

export haversine,forwardAzmuth, destination

function haversine(args::Array{Float64})
   lat1 = args[1];
   long1 = args[2];
   lat2 = args[3];
   long2 = args[4];
   return 2 * 6372800 * asin(sqrt(sind((lat2 - lat1)/2)^2 + cosd(lat1) * cosd(lat2) * sind((long2 - long1)/2)^2))
end

function forwardAzmuth(args::Array{Float64})
   lat1 = args[1];
   long1 = args[2];
   lat2 = args[3];
   long2 = args[4];

   phi1 = lat1*(2*pi/360);
   phi2 = lat2*(2*pi/360);
   lam1 = long1*(2*pi/360);
   lam2 = long2*(2*pi/360);

   #x = cos(lat1)*sin(lat2) - sin(lat1)*cos(lat2)*cos(long2 - long1)
   #y = sin(long2 - long1)*cos(lat2);
   x = sin(lam2 - lam1)*cos(phi2);
   y = cos(phi1)*sin(phi2) - sin(phi1)*cos(phi2)*cos(lam2-lam1)
   return atan2(x,y) % (2*pi);
end

function destination(args::Array{Float64})
  res = Array(Float64,2);
  srcLat = args[1]*(2*pi/360);
  srcLong = args[2]*(2*pi/360);
  azmuth = args[3]
  distanceInMeters = args[4];
  distanceInRadians = distanceInMeters/6372800;
  destLat = asin(sin(srcLat)*cos(distanceInRadians)+cos(srcLat)*sin(distanceInRadians)*cos(azmuth));
  dlong = atan2(sin(azmuth)*sin(distanceInRadians)*cos(srcLat),cos(distanceInRadians) - sin(srcLat)*sin(destLat));
  destLong = (srcLong - dlong + pi) % (2*pi) - pi;
  res[1] = destLat*180/pi;
  res[2] = destLong*180/pi;
  return res;
end

end
