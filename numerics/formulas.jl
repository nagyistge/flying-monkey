module formulas

export haversine

haversine(lat1,long1,lat2,long2) = 2 * 6372.8 * asin(sqrt(sind((lat2 - lat1)/2)^2 + cosd(lat1) * cosd(lat2) * sind((long2 - long1)/2)^2))

end
