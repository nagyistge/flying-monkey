module nav_geo

export haversine,forwardAzmuth

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

end
