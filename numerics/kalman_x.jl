module kalman_x;
import kalman;

s = kalman.initialGuess([0.0,0.0,0.0],[0.1,0.1,0.1]);
m = kalman.newModel("_",0.1,0.1,0);
p = kalman.predict("_",m,s);

kalman.update("_",m,p,[0.0,0.0,0.0],1000);
kalman.extractMeanFromState(s);
kalman.extractVarianceFromState(s);

end
