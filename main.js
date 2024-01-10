// //param buat adc
const safeDistance = 75;
//param buat avc
const desiredSpeed = 7;
// panjang kendaraan
const carLength = 36;
// lebar kendaraan
const carWidth = 18;
const minAcceleration = -3;
const maxAcceleration = 2;
const maxVelocity = 10;

// const bestBrain = '{"levels":[{"inputs":[0.759475943827489,0.6047317443088088,0,0,0],"outputs":[1,1,1,0,1,1],"biases":[-0.26371952458401776,0.08401781976461556,-0.09939186662212504,0.2488416744763437,-0.13528036014749192,-0.07441307970531535],"weights":[[0.29436685774769505,0.016704670295638907,0.09899967404723548,0.12075342738157564,0.08609560608050434,0.3007432154374199],[0.07064785744410262,0.24299060678379084,0.31053232704507905,0.016273327639360975,0.020587427429382785,0.38244426551845095],[0.3446120215132627,-0.1747695245369153,-0.2685741876643112,-0.05475250583018825,-0.20149329500563962,-0.0339462324137835],[-0.12165570281824548,-0.07748603889875597,-0.45755637995379644,0.07693795263942296,-0.18731878912177946,0.06685126884948467],[-0.27789855547557396,-0.06755870040800462,-0.05970465753241809,-0.014478831002688852,0.37847455199431346,-0.05110436556930477]]},{"inputs":[1,1,1,0,1,1],"outputs":[1,0,1,0],"biases":[-0.37187338099279943,0.0760950059534175,0.11727233062858461,-0.22660740353415912],"weights":[[0.48359977917171737,0.22325587330977534,0.34019587319535505,-0.440169489338618],[-0.031926322849961566,0.08177586988101865,0.25729863392387475,-0.17671571059313204],[-0.18593835726831068,-0.18479139186865112,0.10006282951120285,-0.2044140706434912],[-0.017301357888319616,-0.28705270859023274,0.2639351546823253,0.6518249056260568],[-0.012693749902835741,0.04645315067170175,-0.022915058201208253,0.1881437208364838],[-0.2258279986172293,-0.09859395708809028,-0.404274890877932,-0.2616050544308039]]}]}'

let firstCar = true;
let time = 0;
let resetDataCooldown = 3;

let RelativeDistance = 0;
let LeadCarSpeed = 0;
let LeadCarAcceleration = 0;
let EgoCarSpeed = 0;
let EgoCarAcceleration = 0;
let fitness = 1;

const optimMaxIter = 100;

const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;
// const networkCanvas = document.getElementById("networkCanvas");
// networkCanvas.width = 300;

carCtx = carCanvas.getContext("2d");

let charts = [];
// networkCtx = networkCanvas.getContext("2d");

const road = new Road(carCanvas.width / 2,carCanvas.width * 0.9);

const N = 5;

const modes = {
    1: ["KEYS"],
    2: ["ACC", "bestACC"],
    3: ["AI", "bestBrain"],
};

let mode = "KEYS";
let data = null;

// //ini konstanta yang terbaik buat avc
// this.kp = 0.89; 
// this.ki = 0.01;
// this.kd = 0.1;

const prevCars = JSON.parse(localStorage.getItem("gene"));
// let cars = (prevCars != 'null' || !prevCars) ? prevCars : generateCars(N);
let cars = generateCars(N);
if(prevCars){
    for (let i = 0; i < cars.length; i++){
        cars[i].brain = prevCars[i].brain;
    }
};
let bestCar = cars[0];

let mutationRange = UserInterface.initMutationRange();
let generation = UserInterface.initGeneration();
let trainingTime = UserInterface.initTrainingTime();
let training = UserInterface.initTraining();
let currentMode = UserInterface.initCurrentMode();

let algorithm = new GeneticAlgorithm(cars);
let reload = true;

const traffic = [];

function generateCars(N){
    const cars = [];
    for(let i = 1; i <= N; i++) {
        cars.push(new Car(road.getLaneCenter(1), 100, carWidth, carLength, mode, 10, "blue"));
        Brain.insert(cars[i-1], data, mode);
    }
    return cars;
}

function updateGenerationInfo(generation) {
    const generationInfo = document.getElementById('generationInfo');
    generationInfo.textContent = `Generasi: ${generation}`;
    localStorage.setItem("generation", generation);
}

function calculateDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  

function animate() {
    // mutationRange = parseFloat(document.getElementById('mutationDropdown').value);
    // localStorage.setItem("mutationRange", mutationRange);
    // cars = cars.filter(car => !car.damaged);

    for (let i = 0; i < traffic.length; i++) {
        traffic[i].update(road.borders, []);
    }

    // Menggunakan map dan Math.min untuk mencari mobil dengan y terendah
    let bestCar = cars.find(c => c.y === Math.min(...cars.map(c => c.y)));

    for (let i = 0; i < cars.length; i++) {
        cars[i].update(road.borders, traffic);

        if (cars[i] === bestCar) {
            EgoCarSpeed = cars[i].speedOutput;
            EgoCarAcceleration = cars[i].accelerationOutput;
            LeadCarSpeed = cars[i].leadCarVelocity[1];
            LeadCarAcceleration = cars[i].LeadCarAcceleration;
            RelativeDistance = cars[i].relativeDistance;
            fitness = cars[i].fitness;
            // console.log('ego car speed: ' + EgoCarSpeed);
            // console.log("Fitness: " + fitness);
        }
    }

    if (Math.random()>0){        
        if(((Math.abs(Math.floor(bestCar.y))) % 50 == 0) && (bestCar.y != 100)){
            const numDummy = (Math.random() * 3) + 3;
            for (let i = 0; i < numDummy; i++){
                const dummyY = bestCar.y - 600;
                const lane = Math.floor(Math.random() * 3);
                const setSpeed = Math.floor(Math.random() * 4);
                traffic.push(new Car(road.getLaneCenter(lane), dummyY, carWidth, carLength, "DUMMY",  setSpeed, getRandomColor()));
            }
        }
    }

    carCanvas.height = window.innerHeight;

    carCtx.save();
    carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7);

    road.draw(carCtx);

    for (let i = 0; i < traffic.length; i++) {
        traffic[i].draw(carCtx, false);
    }

    carCtx.globalAlpha = 0.2;

    for (let i = 0; i < cars.length; i++) {
        cars[i].draw(carCtx);
    }

    carCtx.globalAlpha = 1;
    if(!bestCar.damaged){
        bestCar.draw(carCtx, true);
    }else{
        bestCar.draw(carCtx, false);
    }
    carCtx.restore();

    // if ((time >= trainingTime) && training){
    //     bestCar = cars.find(c => c.fitness === Math.max(...cars.map(c => c.fitness)));
    //     localStorage.setItem(data, JSON.stringify(bestCar.brain));
    //     const existingData = localStorage.getItem('bestCarFitness');
    //     const newData = bestCar.fitness;
    //     const combinedData = existingData ? `${existingData} ${newData}` : newData;
    //     if(training){
    //         generation = parseInt(localStorage.getItem('generation'));
    //         generation++;
    //         localStorage.setItem('generation', generation);
    //         updateGenerationInfo(generation); 
    //     }
    //     training = false;

    //     // Menyimpan data baru ke dalam localStorage
    //     localStorage.setItem('bestCarFitness', combinedData);
    //     location.reload();
    // }

    // Menambahkan data ke dalam chart
    modifyData(time, EgoCarSpeed, EgoCarAcceleration, LeadCarAcceleration, RelativeDistance, fitness);

    time += 1 / 30;
    // console.log('controls: ' + JSON.stringify(bestCar.controls));

    if(((Math.floor(time) == trainingTime) && reload) && training){
        reload = false;
        algorithm.endIter(cars);
    }

    requestAnimationFrame(animate);
}