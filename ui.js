// function save() {;
//     localStorage.setItem(data, JSON.stringify(bestCar.brain));
// }

// function discard() {
//     localStorage.removeItem(data);
// }

// function downloadJSON() {
//     const selectedVariable = document.getElementById("variableDropdown").value;
//     const jsonData = localStorage.getItem(selectedVariable);

//     if (jsonData) {
//         const blob = new Blob([jsonData], { type: "application/json" });
//         const url = URL.createObjectURL(blob);

//         const a = document.createElement("a");
//         a.style.display = "none";
//         a.href = url;
//         a.download = selectedVariable + ".json";
//         document.body.appendChild(a);

//         a.click();

//         window.URL.revokeObjectURL(url);
//         document.body.removeChild(a);
//     } else {
//         console.log(`Data JSON dengan kunci '${selectedVariable}' tidak ditemukan di localStorage`);
//     }
// }

// params = mutationRange, trainingTime, training, currentMode, generation
// I/O params = cars.brain
class UserInterface{
    static initMutationRange(){
        let mutationRange = 0;
        mutationRange = this.setMutationRange(mutationRange);
        return mutationRange;
    }

    static initTrainingTime(){
        let trainingTime = 10;
        trainingTime = this.setTrainingTime(trainingTime);
        return trainingTime;
    }

    static initTraining(){
        let training = false;
        training = this.setTraining(training);
        return training;
    }

    static initCurrentMode(){
        let currentMode = 1;
        currentMode = this.setCurrentMode(currentMode);
        return currentMode;
    }

    static initGeneration(){
        let generation = 1;
        generation = this.setGeneration(generation);
        return generation;
    }

    static setMutationRange(mutationRange, click=false){
        const mutationRangeButton = document.getElementById('mutationRangeButton');
        const mutationRangeData = parseFloat(localStorage.getItem('mutationRange'));

        if(((mutationRangeData == 'NaN') || !mutationRangeData) && mutationRangeData != 0){
            console.log('masuk if')
            mutationRange = 0;
            localStorage.setItem('mutationRange', mutationRange);
        }
        if(click){
            console.log('masuk click');
            localStorage.setItem('mutationRange', mutationRange);
        }else{
            mutationRange = mutationRangeData;
        }
        mutationRangeButton.value = mutationRange;
        return mutationRange;
    }

    static setTrainingTime(trainingTime){
        const trainingTimeButton = document.getElementById('trainingTimeButton');
        const trainingTimeData = parseInt(localStorage.getItem('trainingTime'));

        if((trainingTimeData == "NaN") || !trainingTimeData){
            trainingTime = 10;
            localStorage.setItem("trainingTime", trainingTime);
        }else{
            trainingTime = trainingTimeData;
        }
        // console.log(trainingTime);
        trainingTimeButton.value = trainingTime;
        return trainingTime;
    }
    
    // untuk bagian setGeneration mungkin masih perlu debugging
    static setTraining(training, click=false){
        const button = document.getElementById("trainingModeButton");
        const trainingData = localStorage.getItem('training');

        if((trainingData == "undefined") || !trainingData){
            training = false;
            localStorage.setItem("training", training);
            button.textContent = 'Training mode: OFF';
            generation = "-"
        }else{
            if (click){
                training = !(trainingData == "true");
                localStorage.setItem('training', training);
            }else{
                training = (trainingData == "true");
            }
            generation = training ? 1 : '-';
            button.textContent = training ? 'Training mode: ON' : 'Training mode: OFF';
        }

        // this.setGeneration(generation);
        return training;
    }

    static setCurrentMode(currentMode, click=false){
        const modeButton = document.getElementById("currentModeButton");
        const currentModeData = parseInt(localStorage.getItem("currentMode"));
        if((currentModeData == "NaN") || !currentModeData){
            // currentMode = 1;
            currentMode = 2;
            localStorage.setItem('currentMode', currentMode);
        }else if (click){
            // currentMode = (currentModeData % 2) + 1;
            currentMode = 2;
        }else{
            // currentMode = currentModeData;
            currentMode = 2;
        }
        mode = modes[currentMode][0];
        data = modes[currentMode][1];

        modeButton.textContent = mode;

        localStorage.setItem('currentMode', currentMode);

        for(let i = 0; i < cars.length; i++){
            Brain.insert(cars[i], data, mode);
        }
        return currentMode;
    }

    // coba di tes dulu sebelum debugging
    static setGeneration(generation){
        const generationInfo = document.getElementById('generationInfo');
        const genData = parseInt(localStorage.getItem('generation'));
        if((genData == "NaN") || !genData){
            console.log("masuk if");
            localStorage.setItem("generation", generation);
        }else{
            console.log('masuk else');
            generation = genData + 1;
        }
        localStorage.setItem("generation", generation);
        generationInfo.textContent = `Generasi: ${generation}`;
    }

    static save() {;
        localStorage.setItem(data, JSON.stringify(bestCar.brain));
    }
    
    static discard() {
        localStorage.removeItem(data);
    }
    
    static downloadJSON() {
        const jsonData = JSON.parse(localStorage.getItem(bestCar.brain));
    
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
}