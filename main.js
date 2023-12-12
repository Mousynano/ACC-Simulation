// //param buat adc
const safeDistance = 75;
//param buat avc
const desiredSpeed = 8;
// panjang kendaraan
const carLength = 36;
// lebar kendaraan
const carWidth = 18;
const minAcceleration = -3; // ini masih belum disesuaikan
const maxAcceleration = 2; // ini masih belum disesuaikan
const maxVelocity = 10; // ini masih belum disesuaikan

const bestBrain = '{"levels":[{"inputs":[0.759475943827489,0.6047317443088088,0,0,0],"outputs":[1,1,1,0,1,1],"biases":[-0.26371952458401776,0.08401781976461556,-0.09939186662212504,0.2488416744763437,-0.13528036014749192,-0.07441307970531535],"weights":[[0.29436685774769505,0.016704670295638907,0.09899967404723548,0.12075342738157564,0.08609560608050434,0.3007432154374199],[0.07064785744410262,0.24299060678379084,0.31053232704507905,0.016273327639360975,0.020587427429382785,0.38244426551845095],[0.3446120215132627,-0.1747695245369153,-0.2685741876643112,-0.05475250583018825,-0.20149329500563962,-0.0339462324137835],[-0.12165570281824548,-0.07748603889875597,-0.45755637995379644,0.07693795263942296,-0.18731878912177946,0.06685126884948467],[-0.27789855547557396,-0.06755870040800462,-0.05970465753241809,-0.014478831002688852,0.37847455199431346,-0.05110436556930477]]},{"inputs":[1,1,1,0,1,1],"outputs":[1,0,1,0],"biases":[-0.37187338099279943,0.0760950059534175,0.11727233062858461,-0.22660740353415912],"weights":[[0.48359977917171737,0.22325587330977534,0.34019587319535505,-0.440169489338618],[-0.031926322849961566,0.08177586988101865,0.25729863392387475,-0.17671571059313204],[-0.18593835726831068,-0.18479139186865112,0.10006282951120285,-0.2044140706434912],[-0.017301357888319616,-0.28705270859023274,0.2639351546823253,0.6518249056260568],[-0.012693749902835741,0.04645315067170175,-0.022915058201208253,0.1881437208364838],[-0.2258279986172293,-0.09859395708809028,-0.404274890877932,-0.2616050544308039]]}]}'

let firstCar = true;
let time = 0;
let resetDataCooldown = 3;

let mutationRange = 0;
if((localStorage.getItem('mutationRange') == "NaN") || !localStorage.getItem('mutationRange')){
    console.log("if");
    mutationRange = 0;
    localStorage.setItem("mutationRange", mutationRange);
}else{
    console.log("else")
    mutationRange = parseFloat(localStorage.getItem('mutationRange'));
}
document.getElementById('mutationDropdown').value = mutationRange;

let trainingTime = 10;
if((localStorage.getItem('trainingTime') == "NaN") || !localStorage.getItem('trainingTime')){
    trainingTime = 10;
    localStorage.setItem("trainingTime", trainingTime);
}else{
    trainingTime = parseFloat(localStorage.getItem('trainingTime'));
}
document.getElementById('trainingTime').value = trainingTime;

let training = false;
const button = document.querySelector('button');
if((localStorage.getItem('training') == "NaN") || !localStorage.getItem('training')){
    console.log("if");
    training = false;
    localStorage.setItem("training", training);
    button.textContent = 'Training mode: OFF';
}else{
    console.log("else");
    training = (localStorage.getItem('training') == "true");
    if(training){
        button.textContent = 'Training mode: ON';
    }else{
        button.textContent = 'Training mode: OFF';
    }
}

let generation = 80;
// if((localStorage.getItem('generation') == "NaN") || !localStorage.getItem('generation')){
//     localStorage.setItem("generation", generation);
// }else{
//     generation = parseInt(localStorage.getItem('generation'));
//     generation++;
// }
localStorage.setItem("generation", generation);
updateGenerationInfo(generation);

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

const modes = {
    1: ["KEYS"],
    2: ["ACC", "bestACC"],
    3: ["AI", "bestBrain"],
};

// Mengecek apakah 'currentMode' sudah ada di localStorage
let currentMode = localStorage.getItem('currentMode');

// Jika tidak ada, berikan nilai awal 1 dan simpan di localStorage
if (!currentMode) {
    currentMode = 1;
    localStorage.setItem('currentMode', currentMode);
} else {
    // Jika ada, konversi nilai dari localStorage ke tipe numerik
    currentMode = parseInt(currentMode);
}
let mode = modes[currentMode][0];
let data = modes[currentMode][1];
 
const modeButton = document.querySelector("#verticalButtons button:last-child");
modeButton.textContent = mode;

const road = new Road(carCanvas.width / 2,carCanvas.width * 0.9);

const N = 100;

let cars = generateCars(N);
let bestCar = cars[0];

const traffic = [];

document.addEventListener('DOMContentLoaded', function () {
    const veloCtx = document.getElementById('Kecepatan').getContext('2d');
    const accelerationCtx = document.getElementById('Percepatan').getContext('2d');
    const distanceCtx = document.getElementById('JarakRelatif').getContext('2d');
    const fitnessCtx = document.getElementById('Fitness').getContext('2d');
    
    charts[0] = createChart(veloCtx, 'KecepatanEgo');
    charts[1] = createChart(accelerationCtx, 'PercepatanEgo');
    charts[2] = createChart(distanceCtx, 'JarakRelatif');
    charts[3] = createChart(fitnessCtx, 'Fitness', false);

    window.modifyData = function (time, speedEgo, accelerationEgo, accelerationLead, distance, fitness) {
        addData(charts[0], time, speedEgo);
        addData(charts[1], time, accelerationEgo);
        addData(charts[2], time, distance);
        addData(charts[3], time, fitness);

        removeOldData(charts, time);
    };

    animate();
});

function createChart(ctx, label) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: label,
                data: [],
                borderColor: 'blue',
                fill: false,
                pointRadius: 0,
            }],
        },
        options: {
            animation: {
                duration: 0
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                },
            },
        },
    });
}

// Fungsi removeOldData diperbarui untuk mempertimbangkan chart mana yang perlu dihapus
function removeOldData(charts, time) {
    const delayToRemove = 5; // Penundaan waktu sebelum mulai menghapus data (5 detik)

    if (time > delayToRemove) {
        const currentTime = time - delayToRemove;

        charts.forEach((chart, index) => {
            if (index !== 3) { // Hanya chart ke-3 yang tidak dihapus
                while (chart.data.labels.length > 0 && chart.data.labels[0] <= currentTime) {
                    chart.data.labels.shift();
                    chart.data.datasets[0].data.shift();
                }
                chart.update();
            }
        });
    }
}

function addData(chart, time, value) {
    chart.data.labels.push(time);
    chart.data.datasets[0].data.push(value);
    chart.update();
}

function updateGenerationInfo(generation) {
    const generationInfo = document.getElementById('generationInfo');
    generationInfo.textContent = `Generasi: ${generation}`;
    localStorage.setItem("generation", generation);
}

function trainingMode() {
    // Ganti teks pada tombol berdasarkan status trainingMode
    const button = document.querySelector('button');
    if (button.textContent.includes('OFF')) {
        button.textContent = 'Training mode: ON';
        training = true;
        generation = 0;
        
    } else {
        button.textContent = 'Training mode: OFF';
        training = false;
        generation = "-";
    }
    updateGenerationInfo(generation);
    localStorage.setItem('training', training);
    localStorage.setItem("generation", generation);
}

function changeMode() {
    const modeButton = document.querySelector("#verticalButtons button:nth-child(9)");
    currentMode = (currentMode % 3) + 1;
    const mode = modes[currentMode][0];
    const data = modes[currentMode][1]; 
    modeButton.textContent = mode;

    // Simpan nilai currentMode di localStorage
    localStorage.setItem('currentMode', currentMode);
    // console.log(data);

    //bagian ini masih kurang bagus untuk praktiknya
    if (localStorage.getItem(data)){
        if(data == "bestACC"){
            for(let i = 0; i < cars.length; i++){
                cars[i].brain = JSON.parse(localStorage.getItem(data));
                if(i != 0){
                    cars[i].brain = AdaptiveCruiseControl.mutate(cars[i].brain, mutationRange);
                }
                cars[i].sensor = new Sensor(cars[i], 1);
                cars[i].useBrain = false;
                cars[i].useACC = true;
            }
        }else if(mode == "AI"){
            for(let i = 0; i < cars.length; i++){
                cars[i].brain = JSON.parse(localStorage.getItem(data));
                if(i != 0){ 
                    cars[i].brain = NeuralNetwork.mutate(cars[i].brain, mutationRange);
                }
                cars[i].sensor = new Sensor(cars[i], 5);
                cars[i].useBrain = true;
                cars[i].useACC = false;
            }
        }else if (mode == "KEYS"){
            for(let i = 0; i < cars.length; i++){
                cars[i].brain = null;
                cars[i].sensor = new Sensor(cars[i], 0);
                cars[i].useBrain = false;
                cars[i].useACC = false;
            }
        }
    }else{
        if(mode == "ACC"){
            for(let i = 0; i < cars.length; i++){
                cars[i].sensor = new Sensor(cars[i], 1);
                cars[i].brain = new AdaptiveCruiseControl();
                cars[i].useBrain = false;
                cars[i].useACC = true;
            }
        }else if(mode == "AI"){
            for(let i = 0; i < cars.length; i++){
                cars[i].sensor = new Sensor(cars[i], 5);
                cars[i].brain = new NeuralNetwork([this.sensor.rayCount, 8, 6, 4]);
                cars[i].useBrain = true;
                cars[i].useACC = false;
            }
        }else if (mode == "KEYS"){
            for(let i = 0; i < cars.length; i++){
                cars[i].sensor = new Sensor(cars[i], 0);
                cars[i].brain = null;
                cars[i].useBrain = false;
                cars[i].useACC = false;
            }
        }
    }
}

function save() {;
    localStorage.setItem(data, JSON.stringify(bestCar.brain));
}

function discard() {
    localStorage.removeItem(data);
}

function downloadJSON() {
    const selectedVariable = document.getElementById("variableDropdown").value;
    const jsonData = localStorage.getItem(selectedVariable);

    if (jsonData) {
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = selectedVariable + ".json";
        document.body.appendChild(a);

        a.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } else {
        console.log(`Data JSON dengan kunci '${selectedVariable}' tidak ditemukan di localStorage`);
    }
}

function generateCars(N){
    const cars = [];
    for(let i = 1; i <= N; i++) {
        cars.push(new Car(road.getLaneCenter(1), 100, carWidth, carLength, mode, 10, "blue"));
        firstCar = false;
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
    mutationRange = parseFloat(document.getElementById('mutationDropdown').value);
    localStorage.setItem("mutationRange", mutationRange);
    cars = cars.filter(car => !car.damaged);

    for (let i = 0; i < traffic.length; i++) {
        traffic[i].update(road.borders, []);
    }

    // Menggunakan map dan Math.min untuk mencari mobil dengan y terendah
    let bestCar = cars.find(c => c.y === Math.min(...cars.map(c => c.y)));

    for (let i = 0; i < cars.length; i++) {
        cars[i].update(road.borders, traffic);

        if (cars[i] === bestCar) {
            EgoCarSpeed = cars[i].egoCarVelocity[1];
            EgoCarAcceleration = cars[i].accelerationOutput;
            LeadCarSpeed = cars[i].leadCarVelocity[1];
            LeadCarAcceleration = cars[i].LeadCarAcceleration;
            RelativeDistance = cars[i].relativeDistance;
            fitness = cars[i].fitness;
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
        traffic[i].draw(carCtx, "red");
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

    if ((time >= trainingTime) && training){
        bestCar = cars.find(c => c.fitness === Math.max(...cars.map(c => c.fitness)));
        localStorage.setItem(data, JSON.stringify(bestCar.brain));
        const existingData = localStorage.getItem('bestCarFitness');
        const newData = bestCar.fitness;
        const combinedData = existingData ? `${existingData} ${newData}` : newData;
        if(training){
            generation = parseInt(localStorage.getItem('generation'));
            generation++;
            localStorage.setItem('generation', generation);
            updateGenerationInfo(generation); 
        }
        training = false;

        // Menyimpan data baru ke dalam localStorage
        localStorage.setItem('bestCarFitness', combinedData);
        location.reload();
    }

    // Menambahkan data ke dalam chart
    modifyData(time, EgoCarSpeed, EgoCarAcceleration, LeadCarAcceleration, RelativeDistance, fitness);

    time += 1 / 30;

    requestAnimationFrame(animate);
}