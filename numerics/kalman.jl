module kalman;
import StateSpace;
import Distributions;

export newModel,initialGuess,predict,update,extractMeanFromState,extractVarianceFromState;

deltaTLatch = Dict{UTF8String,Float64}();

function initialGuess(observations::Array{Float64,1},varianceEstimate::Array{Float64,1})
   return Distributions.MvNormal(copy(observations),copy(varianceEstimate))
end

function newModel(id,processVariance::Float64,observationVariance::Float64)
   #f(t) = deltaTLatch[id]
   f(t) = eye(3);
   v(t) = eye(3)*processVariance;
   g(t) = eye(3);
   w(t) = eye(3)*observationVariance;

   return StateSpace.LinearGaussianSSM(f,(t)->zeros(Float64,3,1),v,g,w);
end

function update(id,model,predictedState,observations,deltaT)
   deltaTLatch[id] = deltaT
   return StateSpace.update(model,predictedState,copy(observations));
end

function predict(id,model,state,deltaT)
   deltaTLatch[id] = deltaT
   return StateSpace.predict(model,state)
end

function extractMeanFromState(state)
   return Distributions.mean(state)
end

function extractVarianceFromState(state)
   return Distributions.var(state)
end

end
