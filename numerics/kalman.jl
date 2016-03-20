module kalman;
import StateSpace;
import Distributions;

export newModel,initialGuess,predict,update,extractMeanFromState,extractVarianceFromState;

sampleTimeDeltaTable = Dict{UTF8String,Float64}();

function initialGuess(observations::Array{Float64,1},varianceEstimate::Array{Float64,1})
   state = [observations; [0.0,0.0,0.0]]
   variance  = [varianceEstimate; [0.0001,0.0001,0.0001]]
   return Distributions.MvNormal(state,variance)
end

function fThunk(id)
   function f(t)
      dt = sampleTimeDeltaTable[id];
      F = eye(6)
      F[1,4] = dt
      F[2,5] = dt
      F[3,6] = dt
      return F;
   end
   return f
end

function qThunk(id,accVar)
   function q(t)
      dt = sampleTimeDeltaTable[id];
      G = [ dt^2/2; dt^2/2; dt^2/2; dt; dt; dt ]
      Q = eye(6).*(G*G'*accVar);
      return Q;
   end
   return q
end

function recordSampleTimeDelta(id,sampleTimeDelta)
   sampleTimeDeltaTable[id] = sampleTimeDelta;
end

function newModel(id,accVar::Float64,obVar::Float64,dt0)
   H = [ eye(3) zeros(3,3) ];
   R = eye(3)*obVar;
   recordSampleTimeDelta(id,dt0);
   return StateSpace.LinearGaussianSSM(fThunk(id),(t)->zeros(Float64,6,1),qThunk(id,accVar),(t)->H,(t)->R);
end

function update(id,model,predictedState,observations,dt)
   recordSampleTimeDelta(id,dt);
   return StateSpace.update(model,predictedState,copy(observations));
end

function predict(id,model,state)
   return StateSpace.predict(model,state)
end

function extractMeanFromState(state)
   return Distributions.mean(state)
end

function extractVarianceFromState(state)
   return Distributions.var(state)
end

end
