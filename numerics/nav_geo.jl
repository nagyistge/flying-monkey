module nav_geo

export haversine,forwardAzmuth,destination,speed,deltaF

function earthRadius(lat)
   a =  6378137.0;
   b =  6356752.3;
   phi = lat*pi/180;
   return sqrt(((a^2*cos(phi))^2 + (b^2*sin(phi))^2)/((a*cos(phi))^2 + (b*sin(phi))^2));
end

function haversine(args::Array{Float64})
   lat1 = args[1];
   long1 = args[2];
   lat2 = args[3];
   long2 = args[4];

   phi1 = lat1*pi/180;
   phi2 = lat2*pi/180;
   lam1 = long1*pi/180;
   lam2 = long2*pi/180;

   return 2 * earthRadius(lat1) * asin(sqrt(sin((phi2 - phi1)/2)^2 + cos(phi1) * cos(phi2) * sin((lam2 - lam1)/2)^2))
end

function forwardAzmuth(args::Array{Float64})
   lat1 = args[1];
   long1 = args[2];
   lat2 = args[3];
   long2 = args[4];

   phi1 = lat1*pi/180;
   phi2 = lat2*pi/180;
   lam1 = long1*pi/180;
   lam2 = long2*pi/180;

   x = sin(lam2 - lam1)*cos(phi2);
   y = cos(phi1)*sin(phi2) - sin(phi1)*cos(phi2)*cos(lam2-lam1)
   return atan2(x,y) % (2*pi);
end

function destination(args::Array{Float64})
   res = Array(Float64,2);
   srcLat = args[1]*pi/180;
   srcLong = args[2]*pi/180;
   azmuth = args[3]
   distanceInMeters = args[4];
   distanceInRadians = distanceInMeters/earthRadius(args[1]);
   destLat = asin(sin(srcLat)*cos(distanceInRadians) + cos(srcLat)*sin(distanceInRadians)*cos(azmuth));
   dlong = srcLong + atan2(sin(azmuth)*sin(distanceInRadians)*cos(srcLat),cos(distanceInRadians) - sin(srcLat)*sin(destLat));
   destLong = (dlong + 3*pi) % (2*pi) - pi;
   res[1] = destLat*180/pi;
   res[2] = destLong*180/pi;
   return res;
end

speed(x) = 7*(2/(1 + e^-(abs(x/10)^(5/4))) - 1)

function deltaF(args::Array{Float64})
   gradient = Array(Float64,2);

   r = args[1];
   theta = args[2];
   s = args[3];
   gradient[1] = -2*r*(s/(s + 1)*e^-(2*r/(s + 1))*(2 - 0.5*cos(theta + pi))  + 2*e^-(0.25*r^2)) + 1;
   gradient[2] = 0.5*s*e^-(2*r/(s + 1))*sin(theta);
   return gradient;
end

end
