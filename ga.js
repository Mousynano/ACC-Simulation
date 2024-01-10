class GeneticAlgorithm{
    constructor(cars, mutation=0.4, crossover=0.7){
        this.mutation = mutation;
        this.crossover = crossover;
        this.cars = cars;
        this.best = null;
        this.secondBest = null;
        this.child = null;
        this.tempCars = [];
        this.fitness;
    }

    endIter(cars){
        this.cars = this.#elitism(cars);
        const [child1, child2] = this.#crossover(this.best, this.secondBest);
        const [mutant1, mutant2] = this.#mutation(child1, child2);
        this.#regenerate(mutant1, mutant2);
        location.reload(true);
    }

    #elitism(){
        const sortedCars = cars.sort((car1, car2) => car1.fitness - car2.fitness);
        this.best = sortedCars[0];
        this.secondBest = sortedCars[1];
        return sortedCars;

    }

    #crossover(best, secondBest){
        let [cRand1, cRand2] = [Math.random(), Math.random()];
        let [child1, child2] = [best, best];
        if(this.crossover > cRand1 && this.crossover > cRand2){
            [child1.brain.kp, child1.brain.ki, child1.brain.kd] = [secondBest.brain.kp, best.brain.ki, secondBest.brain.kd];
            [child2.brain.kp, child2.brain.ki, child2.brain.kd] = [best.brain.kp, secondBest.brain.ki, secondBest.brain.kd];
        }else{
            if(this.crossover > cRand1){
                [child1.brain.kp, child1.brain.ki, child1.brain.kd] = [secondBest.brain.kp, secondBest.brain.ki, best.brain.kd];
                [child2.brain.kp, child2.brain.ki, child2.brain.kd] = [secondBest.brain.kp, best.brain.ki, secondBest.brain.kd];
            }
            else if(this.crossover > cRand2){
                [child1.brain.kp, child1.brain.ki, child1.brain.kd] = [best.brain.kp, secondBest.brain.ki, secondBest.brain.kd];
                [child2.brain.kp, child2.brain.ki, child2.brain.kd] = [secondBest.brain.kp, secondBest.brain.ki, best.brain.kd];
            }
            else{
                [child1, child2] = [best, secondBest];
            }
        }
        return [child1, child2];
    }

    #mutation(child1, child2){
        if(this.mutation > Math.random()){
            child1.brain.kp = lerp(child1.brain.kp, (Math.random() * 2) - 1, mutationRange);
            child1.brain.ki = lerp(child1.brain.ki, (Math.random() * 2) - 1, mutationRange);
            child1.brain.kd = lerp(child1.brain.kd, (Math.random() * 2) - 1, mutationRange);
            child2.brain.kp = lerp(child2.brain.kp, (Math.random() * 2) - 1, mutationRange);
            child2.brain.ki = lerp(child2.brain.ki, (Math.random() * 2) - 1, mutationRange); 
            child2.brain.kd = lerp(child2.brain.kd, (Math.random() * 2) - 1, mutationRange);
        }
        return [child1, child2];
    }
    
    #regenerate(){
        this.cars[this.cars.length - 1] = this.best;
        this.cars[this.cars.length - 2] = this.secondBest;
        this.fitness = this.best.fitness;
    
        // Membuat array baru yang hanya berisi properti yang diinginkan dari setiap Car
        const gene = this.cars.map(car => ({ brain: car.brain }));
    
        // Mengonversi array baru menjadi JSON string
        const geneJSON = JSON.stringify(gene);
    
        // Menyimpan JSON string ke dalam localStorage
        localStorage.setItem('gene', geneJSON);
    
        // UserInterface.setGeneration(parseInt(localStorage.getItem('generation') + 4));
    }
}