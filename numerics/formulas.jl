module formulas

export haversine,forwardAzmuth

haversine(lat1,long1,lat2,long2) = 2 * 6372800 * asin(sqrt(sind((lat2 - lat1)/2)^2 + cosd(lat1) * cosd(lat2) * sind((long2 - long1)/2)^2))

function forwardAzmuth(lat1,long1,lat2,long2)
  dlat = lat2 - lat1;
  dlong = long2 - long1;
  y = sin(long2 - long1)*cos(lat2);
  x = cos(lat1)*sin(lat2) - sin(lat1)*cos(lat2)*cos(long2 - long1)
  return atan2(y,x) % (2*pi);
end

end
