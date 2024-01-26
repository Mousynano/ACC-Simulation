class UserInterface{
    constructor(){
        this.mutationRange;
        this.trainingTime;
        this.training;
        this.currentMode;
        this.generation;
        this.play = true;
        this.desiredSpeed;
        this.objectiveFunction;
        this.maxIter;
    }

    update(){
        return [this.mutationRange, this.currentMode, this.generation, this.trainingTime, this.training, this.play, this.desiredSpeed, this.objectiveFunction, this.maxIter];
    }

    initMutationRange(mutationRange){
        this.mutationRange = this.setMutationRange(mutationRange);
        return this.mutationRange;
    }

    initTrainingTime(trainingTime){
        this.trainingTime = this.setTrainingTime(trainingTime);
        return this.trainingTime;
    }

    initTraining(training){
        this.training = this.setTraining(training);
        return this.training;
    }

    initCurrentMode(currentMode){
        this.currentMode = this.setCurrentMode(currentMode);
        return this.currentMode;
    }

    initDesiredSpeed(desiredSpeed){
        this.desiredSpeed = this.setDesiredSpeed(desiredSpeed);
        return this.desiredSpeed;
    }

    initObjectiveFunction(objectiveFunction){
        this.objectiveFunction = this.setObjectiveFunction(objectiveFunction);
        return this.objectiveFunction;
    }

    initMaxIter(maxIter){
        this.maxIter = this.setMaxIter(maxIter);
        return this.maxIter;
    }

    refreshButton(){
        let generation = parseInt(localStorage.getItem('generation'));
        let carsHistory = JSON.parse(localStorage.getItem('carsHistory'));
        delete bestCarHistory[`gen${generation}`];
        generation -= 1;
        localStorage.setItem('generation', JSON.stringify(generation));
        localStorage.setItem('carsHistory', JSON.stringify(carsHistory));
        location.reload(true);
    }

    undoButton(){
        let generation = parseInt(localStorage.getItem('generation'));
        let carsHistory = JSON.parse(localStorage.getItem('carsHistory'));
        if(generation < 2){
            this.restartButton();
        }else{
            delete carsHistory[`gen${generation}`];
            delete carsHistory[`gen${generation - 1}`];
            generation -= 2;
            localStorage.setItem('generation', JSON.stringify(generation));
            localStorage.setItem('carsHistory', JSON.stringify(carsHistory));
            location.reload(true);
        }
    }

    toggle(play) {
        play = (play == undefined) ? true : play;
        this.play = !play;
        if (this.play) {
            animate();
        }
    
        const toggleButton = document.getElementById('toggleButton');
        const svgIcon = this.play ? './icons/pause-solid.svg' :'./icons/play-solid.svg' 
        const imgElement = document.createElement('img');
        imgElement.src = svgIcon;
        toggleButton.innerHTML = '';
        toggleButton.appendChild(imgElement);
        toggleButton.play = this.play;
    
        return this.play;
    }

    setMaxIter(maxIter, click=false){
        const maxIterButton = document.getElementById('maxIterButton');
        const maxIterData = localStorage.getItem('maxIter');

        if(maxIterData == null){
            maxIter = 100;
        }
        else{
            if(!click){
                maxIter = maxIterData;
            }
        }
        localStorage.setItem('maxIter', maxIter);
        maxIterButton.value = maxIter;
        this.maxIter = maxIter;
        return maxIter;
    }

    setObjectiveFunction(objectiveFunction, click=false){
        const objectiveFunctionButton = document.getElementById('objectiveFunctionButton');
        const objectiveFunctionData = localStorage.getItem('objectiveFunction');

        if(objectiveFunctionData == null){
            objectiveFunction = 'IAE';
        }
        else{
            if(!click){
                objectiveFunction = objectiveFunctionData;
            }
        }
        localStorage.setItem('objectiveFunction', objectiveFunction);
        objectiveFunctionButton.value = objectiveFunction;
        this.objectiveFunction = objectiveFunction;
        return objectiveFunction;
    }

    setDesiredSpeed(desiredSpeed, click=false){
        const desiredSpeedButton = document.getElementById('desiredSpeedButton');
        const desiredSpeedData = localStorage.getItem('desiredSpeed');

        if(desiredSpeedData == null){
            desiredSpeed = 25;
        }
        else{
            if(!click){
                desiredSpeed = parseFloat(desiredSpeedData);
            }
        }
        localStorage.setItem('desiredSpeed', desiredSpeed);
        desiredSpeedButton.value = desiredSpeed;
        this.desiredSpeed = desiredSpeed;
        return desiredSpeed;
    }

    setMutationRange(mutationRange, click=false){
        const mutationRangeButton = document.getElementById('mutationRangeButton');
        const mutationRangeData = localStorage.getItem('mutationRange');

        if(mutationRangeData == null){
            mutationRange = 0.1;
        }
        else{
            if(!click){
                mutationRange = parseFloat(mutationRangeData);
            }
        }
        localStorage.setItem('mutationRange', mutationRange);
        mutationRangeButton.value = mutationRange;
        this.mutationRange = mutationRange;
        return mutationRange;
    }

    setTrainingTime(trainingTime, click=false){
        const trainingTimeButton = document.getElementById('trainingTimeButton');
        const trainingTimeData = localStorage.getItem('trainingTime');

        if(trainingTimeData == null){
            trainingTime = 30;
        }
        else{
            if(!click){
                trainingTime = parseInt(trainingTimeData);
            }
        }
        localStorage.setItem('trainingTime', trainingTime);
        trainingTimeButton.value = trainingTime;
        this.trainingTime = trainingTime;
        return trainingTime;
    }
    
    setTraining(training, click=false){
        const trainingButton = document.getElementById('trainingButton');
        const gear = document.getElementById('trainingGear');
        const trainingData = JSON.parse(localStorage.getItem('training'));

        if (trainingData == null) {
            training = true;
            localStorage.setItem("training", training);
        }else{
            training = click ? !(training == 'true') : trainingData;
        }
        localStorage.setItem('training', training);
        trainingButton.value = training;
        let generation = (training == true) ? 1 : '-';
        this.gearRotation(gear, training);
        this.setGeneration(generation);
        this.training = training;
        return training;
    }

    setCurrentMode(currentMode, click=false){
        const modeButton = document.getElementById("currentModeButton");
        const currentModeData = localStorage.getItem("currentMode");
        if(currentModeData == null){
            currentMode = 2;
            localStorage.setItem('currentMode', currentMode);
        }else {
            if (click){
                currentMode = (parseInt(currentModeData) % 3) + 1;
                for(let i = 0; i < cars.length; i++){
                    Brain.insert(cars[i], data, mode);
                }
                localStorage.setItem('currentMode', currentMode);
            }else{
                currentMode = parseInt(currentModeData);
            }
        }
        mode = modes[currentMode][0];
        data = modes[currentMode][1];
        modeButton.textContent = mode;
        localStorage.setItem('currentMode', currentMode);
        this.currentMode = currentMode;
        return currentMode;
    }
    
    setGeneration(generation){
        const generationInfo = document.getElementById('generationInfo');
        const genData = localStorage.getItem('generation');
        if(genData == null){
            generation = generation;
        }else{
            if(generation != '-'){
                if (genData == '-'){
                    generation = 1;
                }
                else{
                    generation = parseInt(genData) + 1;
                }
            }
        }

        localStorage.setItem('generation', generation);
        generationInfo.textContent = `Generasi: ${generation}`;
        generationInfo.value = generation;
        this.generation = generation;
        return generation;
    }

    restartButton(){
        localStorage.clear();
        location.reload(true);
    }

    save() {
        localStorage.setItem(data, JSON.stringify(bestCar.brain));
    }
    
    downloadJSON() {
        const jsonData1 = localStorage.getItem('carsHistory');
        const jsonData2 = localStorage.getItem('bestCarParams');
    
        if (jsonData1 || jsonData2) {
            if (jsonData1) {
                const formattedJsonData1 = JSON.stringify(JSON.parse(jsonData1), null, 2);
                const blob1 = new Blob([formattedJsonData1], { type: "application/json" });
                const url1 = URL.createObjectURL(blob1);
                const a1 = document.createElement("a");
                a1.style.display = "none";
                a1.href = url1;
                a1.download = `${this.objectiveFunction}_carsHistory_gen${generation}_.json`;
                document.body.appendChild(a1);
                a1.click();
                window.URL.revokeObjectURL(url1);
                document.body.removeChild(a1);
            } else {
                console.log(`Data JSON 'carsHistory' tidak ditemukan di localStorage`);
            }
    
            if (jsonData2) {
                const formattedJsonData2 = JSON.stringify(JSON.parse(jsonData2), null, 2);
                const blob2 = new Blob([formattedJsonData2], { type: "application/json" });
                const url2 = URL.createObjectURL(blob2);
                const a2 = document.createElement("a");
                a2.style.display = "none";
                a2.href = url2;
                a2.download = `${this.objectiveFunction}_bestCarParams_gen${generation}_.json`;
                document.body.appendChild(a2);
                a2.click();
                window.URL.revokeObjectURL(url2);
                document.body.removeChild(a2);
            } else {
                console.log(`Data JSON 'bestCarParams' tidak ditemukan di localStorage`);
            }
        } else {
            console.log(`Tidak ada data JSON yang ditemukan di localStorage`);
        }
    }
    
    

    gearRotation(gear, logic) {
        if (logic){
            gear.classList.add('rotate-animation');
        }else{
            gear.classList.remove('rotate-animation');
        }
    }
}