module kalman;
import StateSpace;

export newSSM,filter;

function newSSM(processMatrix,processCovariance,observationMatrix,observationCovariance)
   return StateSpace.LinearGaussianSSM(processMatrix,processCovariance,observationMatrix,observationCovariance)
end

function filter(linSSM,observations,initialGuess)
   return StateSpace.filter(linSSM,obs',initialGuess)
end

end
