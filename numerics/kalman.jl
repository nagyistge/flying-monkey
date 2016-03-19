module kalman;
import StateSpace;
import Distributions;

export newModel,initialGuess,predict,update,extractMeanFromState,extractVarianceFromState;

sampleTimes = Dict{UTF8String,Array{Float64}}();

function initialGuess(observations::Array{Float64,1},varianceEstimate::Array{Float64,1})
   state = [observations; [0.0,0.0,0.0]]
   variance  = [varianceEstimate; [0.0001,0.0001,0.0001]]
   return Distributions.MvNormal(state,variance)
end

function deltaT(id)
   if length(sampleTimes[id]) == 2
      dt = (sampleTimes[id][1] - sampleTimes[id][2])/1000;
   else
      dt = 1;
   end
   if dt < 0 println("dt is $dt!!!!!!!!!!") end
   return dt;
end

function fThunk(id)
   function f(t)
      dt = deltaT(id);
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
      dt = deltaT(id);
      G = [ dt^2/2; dt^2/2; dt^2/2; dt; dt; dt ]
      Q = eye(6).*(G*G'*accVar);
      return Q;
   end
   return q
end

function recordSampleTime(id,sampleTime)
   if !haskey(sampleTimes,id)
      sampleTimes[id] = Array(Float64,1)
      sampleTimes[id][1] = sampleTime
   else
      if length(sampleTimes[id]) == 2
         sampleTimes[id][2] = sampleTimes[id][1]
      else
         push!(sampleTimes[id],sampleTimes[id][1]);
      end
      sampleTimes[id][1] = sampleTime
   end
end

function newModel(id,accVar::Float64,obVar::Float64,time0)
   H = [ eye(3) zeros(3,3) ];
   R = eye(3)*obVar;
   recordSampleTime(id,time0);
   return StateSpace.LinearGaussianSSM(fThunk(id),(t)->zeros(Float64,6,1),qThunk(id,accVar),(t)->H,(t)->R);
end

function update(id,model,predictedState,observations,sampleTime)
   recordSampleTime(id,sampleTime);
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
