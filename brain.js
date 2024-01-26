
// This class is used to change the models' control by either use the previous models' data or make a new one
class Brain{

    static insert(car, data, mode){
        car.controlType = mode; // Changes he model control mode
        car.controls = new Controls(mode); // Make a new control 

        // If there is a data from previous training, it will use that data
        // else it will make a new control for each car
        if(data && JSON.parse(localStorage.getItem(data))){ 
            if(mode == "ACC"){
                car.sensor = new Sensor(car, 1);
                car.brain = JSON.parse(localStorage.getItem(data));
                car.useBrain = false;
                car.useACC = true;
            }
            else if (mode == "AI"){
                car.sensor = new Sensor(car, 5);
                car.brain = JSON.parse(localStorage.getItem(data));
                car.useBrain = true;
                car.useACC = false;
            }
            else{
                car.sensor = new Sensor(car, 0);
                car.brain = undefined;
                car.useBrain = false;
                car.useACC = false;
            }
        }else{
            if(mode == "ACC"){
                car.sensor = new Sensor(car, 1);
                car.brain = new AdaptiveCruiseControl();
                car.useBrain = false;
                car.useACC = true;
            }
            else if (mode == "AI"){
                car.sensor = new Sensor(car, 5);
                car.brain = new NeuralNetwork([car.sensor.rayCount, 8, 6, 4]);
                car.useBrain = true;
                car.useACC = false;
            }
            else{
                car.sensor = new Sensor(car, 0);
                car.brain = undefined;
                car.useBrain = false;
                car.useACC = false;
            }
        }
    }

    // This is used to sync the ACC parameters from the previous generation
    // The concept is similar from the insert, but it is used to avoid
    // callback error when using insert
    static sync(carBrain, prevBrain){
        carBrain.kp = prevBrain.kp;
        carBrain.ki = prevBrain.ki;
        carBrain.kd = prevBrain.kd;
    }
}
