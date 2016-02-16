module kalman;
import StateSpace;
import Distributions;

export newModel,initialGuess,predict,update;

function initialGuess(observationMatrix::Array{Float64,1},varianceMatrix::Array{Float64,1})
   return Distributions.MvNormal(observationMatrix,varianceMatrix)
end

function newModel(processVariance::Float64,observationVariance::Float64)
   M_p::Matrix{Float64} = eye(2);
   M_v::Matrix{Float64} = eye(2)*processVariance;
   O_p::Matrix{Float64} = eye(2);
   O_v::Matrix{Float64} = eye(2)*observationVariance;

   return StateSpace.LinearGaussianSSM(M_p,M_v,O_p,O_v);
end

function update(model,predictedState,observations)
   return StateSpace.update(model,predictedState,observations);
end

function predict(model,state)
   return StateSpace.predict(model,state)
end

end
