class Brain{
    static insert(car, data, mode){
        car.controlType = mode;
        car.controls = new Controls(mode);
        if(data && JSON.parse(localStorage.getItem(data))){
            console.log('udah ada data');
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
            console.log('belum ada data');
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
}
