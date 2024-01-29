/*
This file is part of Smart Car Simulations.
Smart Car Simulations is free software: you can redistribute it and/or modify it under the terms 
of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Smart Car Simulations is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Foobar. 
If not, see <https://www.gnu.org/licenses/>.
*/

// Initialize  time and distance scale from page to real world values. Only used in graph plotting
const tScale = 30; // seconds per fps
const dScale = 10; // meters per pixels

// Initialize car dimensions in length
const carLength = 36;   //This is supposed to be 3.6 meters
const carWidth = 18;    //And this is supposed to be 1.8 meters

// Initialize threshold and setpoint
// const minAcceleration = -3 / tScale;
// const maxAcceleration = 2 / tScale;
const minAcceleration = -3;
const maxAcceleration = 2;
const minVelocity = -10;
const maxVelocity = 30;

// Time initialization
let time = 0;
const Ts = 1/tScale;

// Initialize variables to be plotted in the chart
let SafeDistance = null;
let RelativeDistance = null;
let LeadCarSpeed = null;
let LeadCarAcceleration = null;
let EgoCarSpeed = null;
let EgoCarAcceleration = null;

// These are then be used to plot the fitness history of the best model from each generation
let generationArr = localStorage.getItem('generationArr');
generationArr = generationArr ? splitArr(generationArr) : [];
let fitnessArr = localStorage.getItem('fitnessArr');
fitnessArr = fitnessArr ? splitArr(fitnessArr) : [];
fitnessArr = Array.isArray(fitnessArr) ? fitnessArr : [fitnessArr];
let fitnessHistoryDisplayed = false;

// Define the canvas for the car
const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;
carCtx = carCanvas.getContext("2d");

// Define the charts that will be used
let charts = [];

// Define the road for the simulation
const road = new Road(carCanvas.width / 2,carCanvas.width * 0.9);

// Initialize the number of models will be used in the training
const N = 5;

// Initialize the modes and the brain being used. It is by default set to ACC for the previous
// research, but you can set it in the UI button logic to unlock AI and KEYS also.
const modes = {
    1: ["KEYS"],
    2: ["ACC", "bestACC"],
    3: ["AI", "bestBrain"],
};

let mode = "KEYS";
let data = null;

//Defining the user interface being used
let ui = new UserInterface();
let play = ui.play;
let generation = (localStorage.getItem('generation') == undefined) ? 1 : (parseInt(localStorage.getItem('generation') )+ 1)
let mutationRange = ui.initMutationRange(0.1);
let currentMode = ui.initCurrentMode(2);
let trainingTime = ui.initTrainingTime(10);
let training = ui.initTraining(true);
let desiredVV = ui.initDesiredSpeed(27);
let objectiveFunction = ui.initObjectiveFunction('IAE');
let maxIter = ui.initMaxIter(5);

// Mostly defines how the cars and traffics works
const prevCars = JSON.parse(localStorage.getItem("gene")); // Loads the previous best model for GA
let cars = generateCars(N); // Defines  the cars that is being used
const traffic = [
    new Car(road.getLaneCenter(1), -350, carWidth, carLength, "DUMMY",  40, getRandomColor()), // The traffic is defined manually to avoid noisy condition with the ACC model
];
let bestCar = cars[cars.length - 1]; // The best model is defined to be the last in the array because the sorting is ascending.

// Used to add the models objects
function generateCars(N){
    let cars = [];
    for(let i = 0; i < N; i++) {
        cars.push(new Car(road.getLaneCenter(1), 200, carWidth, carLength, mode, 40, "blue"));
        Brain.insert(cars[i], data, mode);
        if(prevCars){
            Brain.sync(cars[i].brain, prevCars[i].brain);
        }
    }
    return cars;
}

//Initialize the algorithm being used
let algorithm = new GeneticAlgorithm(cars);

// Used to avoid reprtitive page reloading that causes lag
let reload = true; 

// The main function that loads everything in every frame
function animate() {
    // Button event handling
    [mutationRange, currentMode, generation, trainingTime, training, play, desiredVV, objectiveFunction, maxIter] = ui.update() 

    // Play/pause button handling
    if(!play){
        return
    }

    //Used to update the traffic cars
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].update(road.borders, []);
    }

    // Updates the bestCar to be the car with the most fitness
    let bestCar = cars.find(c => (c.fitness == Math.max(...cars.map(c => c.fitness))) && c.damaged == false);

    // Used to update the models
    // console.log('bagian update data chart harus diteliti dulu')
    for (let i = 0; i < cars.length; i++) {
        cars[i].update(road.borders, traffic);
        // If the car is happens to be the best model, it will plot the data from that car

        // Bagian ini menerima value/nilai-nilai dari car.js
        // Bagian #move untuk DUMMY untuk lead dan ACC untuk ego
        if (cars[i] == bestCar) {
            // console.log(`traffic = ${traffic[0].y}`)
            EgoCarSpeed = (parseFloat(cars[i].vr)).toFixed(10);
            EgoCarAcceleration = (parseFloat(cars[i].ar)).toFixed(10);
            LeadCarSpeed = (parseFloat(traffic[0].vr)).toFixed(10)
            LeadCarAcceleration = (parseFloat(traffic[0].ar)).toFixed(10)
            RelativeDistance = (parseFloat((cars[i].yr - traffic[0].yr))).toFixed(10)
            SafeDistance = (parseFloat(cars[i].safeDistance)).toFixed(10);
        }
    }

    // This is a pseudocode for the AI model to define random traffic
    // if (Math.random()>0){        
    //     if(((Math.abs(Math.floor(bestCar.y))) % 50 == 0) && (bestCar.y != 100)){
    //         const numDummy = (Math.random() * 3) + 3;
    //         for (let i = 0; i < numDummy; i++){
    //             const dummyY = bestCar.y - 600;
    //             const lane = Math.floor(Math.random() * 3);
    //             const setSpeed = Math.floor(Math.random() * 4);
    //             traffic.push(new Car(road.getLaneCenter(lane), dummyY, carWidth, carLength, "DUMMY",  setSpeed, getRandomColor()));
    //         }
    //     }
    // }

    // Defines the camera to follow the best car
    carCanvas.height = window.innerHeight;
    carCtx.save();
    carCtx.translate(0, -bestCar.yv + carCanvas.height * 0.9);

    // Updates the page road
    road.draw(carCtx);

    // Draws the traffic without the sensors drawn
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].draw(carCtx, false);
    }
    carCtx.globalAlpha = 0.2;

    // Draws the cars without the sensors drawn
    for (let i = 0; i < cars.length; i++) {
        cars[i].draw(carCtx, false);
    }
    carCtx.globalAlpha = 1;
    if(!bestCar.damaged){
        bestCar.draw(carCtx, true); // The sensor only drawn to the best car that didn't crash
    }else{
        bestCar.draw(carCtx, false);
    }
    carCtx.restore();

    // Used to display recent data
    modifyData(time, EgoCarSpeed, EgoCarAcceleration, LeadCarSpeed, LeadCarAcceleration, RelativeDistance, SafeDistance, fitnessHistoryDisplayed, generationArr, fitnessArr);
    fitnessHistoryDisplayed = true; // Used to avoid callback for updating the fitness history chart

    time += Ts; // Updates the time with the time step

    // Used to end the iteration
    if(((Math.floor(time) == trainingTime) && reload) && training){
        // Update the reload logic to avoid multiple reload callback
        console.log('reload!');
        reload = false;
        
        // Callback to the end iter method in GA
        algorithm.endIter(cars);
        
        if(generation == maxIter){
            ui.toggle(ui.play)
            ui.downloadJSON();
        }else{
            //Reload
            location.reload(true);
        }
    }

    // Update the frame
    requestAnimationFrame(animate);
}