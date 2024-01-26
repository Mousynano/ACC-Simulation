// This class is used to define how the GA works
class GeneticAlgorithm{
    constructor(cars, mutation=0.4, crossover=0.7){
        // These are the probability of the mutation and crossover that will occur
        this.mutation = mutation;
        this.crossover = crossover;

        // This is the array that will be sorted ascending according to the cars' fitness
        this.cars = cars;
    }

    // This will be triggered whenever the iteration is done
    endIter(cars){
        // Sort the cars by their fitness, and choose the best and secondBest from the training
        let best, secondBest;
        [this.cars, best, secondBest] = this.#elitism(cars);

        // After the elitism, it will the crossover the parameters of the two best models to make child1 and child2
        const [child1, child2] = this.#crossover(best, secondBest);

        // From the crossover, it will be mutated with the according to mutationRange 
        const [mutant1, mutant2] = this.#mutation(child1, child2);

        // The mutated offsprings will then be regenerated to the next generation
        this.#regenerate(mutant1, mutant2, best);
    }

    // Input: array of cars
    // Output: array of sortedCars, best and secondBest car
    #elitism(cars){
        const sortedCars = cars.sort((car1, car2) => car1.fitness - car2.fitness);
        const best = sortedCars[sortedCars.length - 1];
        const secondBest = sortedCars[sortedCars.length - 2];
        return [sortedCars, best, secondBest];
    }

    // Input: best and secondBest car
    // Output: 2 offspring (child1, child2)
    #crossover(best, secondBest){
        const cRand1 = Math.random();
        const cRand2 = Math.random();
        let child1 = new AdaptiveCruiseControl();
        let child2 = new AdaptiveCruiseControl();
        if(this.crossover > cRand1 && this.crossover > cRand2){
            child1.kp = secondBest.brain.kp;
            child1.ki = best.brain.ki;
            child1.kd = secondBest.brain.kd;

            child2.kp = best.brain.kp;
            child2.ki = secondBest.brain.ki;
            child2.kd = secondBest.brain.kd;
        }else{
            if(this.crossover > cRand1){
                child1.kp = secondBest.brain.kp;
                child1.ki = secondBest.brain.ki;
                child1.kd = best.brain.kd;

                child2.kp = secondBest.brain.kp;
                child2.ki = best.brain.ki;
                child2.kd = secondBest.brain.kd;
            }
            else if(this.crossover > cRand2){
                child1.kp = best.brain.kp;
                child1.ki = secondBest.brain.ki;
                child1.kd = secondBest.brain.kd;

                child2.kp = secondBest.brain.kp;
                child2.ki = secondBest.brain.ki;
                child2.kd = best.brain.kd;
            }
            else{
                child1.kp = best.brain.kp;
                child1.ki = best.brain.ki;
                child1.kd = best.brain.kd;

                child2.kp = secondBest.brain.kp;
                child2.ki = secondBest.brain.ki;
                child2.kd = secondBest.brain.kd;
            }
        }
        return [child1, child2];
    }

    // Input: 2 child from crossover
    // Output: 2 mutated offspring
    #mutation(child1, child2){
        if(this.mutation > Math.random()){
            child1.kp = lerp(child1.kp, (Math.random() * 2) - 1, mutationRange);
            child1.ki = lerp(child1.ki, (Math.random() * 2) - 1, mutationRange);
            child1.kd = lerp(child1.kd, (Math.random() * 2) - 1, mutationRange);
            child2.kp = lerp(child2.kp, (Math.random() * 2) - 1, mutationRange);
            child2.ki = lerp(child2.ki, (Math.random() * 2) - 1, mutationRange); 
            child2.kd = lerp(child2.kd, (Math.random() * 2) - 1, mutationRange);
        }
        return [child1, child2];
    }

    // This method will regenerate 
    #regenerate(mutant1, mutant2, best){
        // Mutates the worst and the second worst model by fitness with the mutated offsprings
        this.cars[0].brain = mutant1;
        this.cars[1].brain = mutant2;
        
        // Updates the history
        const generation = parseInt(localStorage.getItem('generation'));
        let carsHistory = (localStorage.getItem('carsHistory') == undefined) ? {} :  JSON.parse(localStorage.getItem('carsHistory'));
        const carsData = [...this.cars].map((car, index) => {
            const riseTimeAverage = calculateAverage(car.brain.stepResponseResult.riseTime);
            const settlingTimeAverage = calculateAverage(car.brain.stepResponseResult.settlingTime);
            const overshootAverage = calculateAverage(car.brain.stepResponseResult.overshoot);
            const overshootPercentageAverage = calculateAverage(car.brain.stepResponseResult.overshootPercentage);
          
            return {
                [`car${index}`]: {
                    kp: car.brain.kp,
                    ki: car.brain.ki,
                    kd: car.brain.kd,
                    fitness: car.fitness,
                    riseTime: riseTimeAverage,
                    settlingTime: settlingTimeAverage,
                    overshoot: overshootAverage,
                    overshootPercentage: overshootPercentageAverage
                }
            };
        });

        localStorage.setItem('bestCarParams', JSON.stringify(this.cars[this.cars.length - 1].brain))

        carsHistory[`gen${generation}`] = carsData;
        localStorage.setItem('carsHistory', JSON.stringify(carsHistory));

        generationArr.push(generation);
        localStorage.setItem('generationArr', generationArr);

        fitnessArr.push(best.fitness);
        localStorage.setItem('fitnessArr', fitnessArr)

        // Update the gene that will be used in the next generation
        const gene = this.cars.map(car => ({ brain: car.brain }));
        localStorage.setItem('gene', JSON.stringify(gene));
    }
   
}