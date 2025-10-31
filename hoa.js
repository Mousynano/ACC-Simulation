class Hiker {
  constructor(minParams, maxParams, position, brain, dimensions = 3) {
    this.brain = brain;
    this.minParams = minParams;
    this.maxParams = maxParams;
    this.position = position;
    this.velocity = Array(dimensions).fill(0);
    this.bestPosition = [...position];
    this.bestValue = -Infinity;
  }

  move() {
    this.position = this.position.map((pos, i) => {
      let newPos = pos + this.velocity[i];
      return Math.min(Math.max(newPos, this.minParams[i]), this.maxParams[i]);
    });
  }
}

class HikingOptimizationAlgorithm {
  constructor(
    hikers,
    minParams = [-5, -5, -5],
    maxParams = [5, 5, 5],
    {
      nHikers = 30,
      maxIteration = 100,
      maximize = true,
    } = {}
  ) {
    this.nHikers = nHikers;
    this.maxIteration = maxIteration;
    this.hikers = hikers.map(
      (h) => new Hiker(minParams, maxParams, h.brain.params, h.brain, minParams.length)
    );
    this.minParams = minParams;
    this.maxParams = maxParams;
    this.maximize = maximize;

    this.bestValue = -Infinity;
    this.bestPosition = Array(minParams.length).fill(0);

    this.history = {
      bestFitness: [],
      bestPosition: [],
    };
  }

  // Tobler’s velocity function
  #toblersVelocity(slope) {
    return 6 * Math.exp(-3.5 * Math.abs(slope + 0.05));
  }

  // Slope = tan(theta)
  #slope(thetaDeg) {
    return Math.tan((thetaDeg * Math.PI) / 180);
  }

  #evaluateHikers() {
    for (const hiker of this.hikers) {
      // Fitness dihitung dari sistem simulasi (misalnya lean_simulate_system)
      // nilai ini harus sudah diset sebelum dipanggil HOA.endIter()
      if (hiker.brain.fitness > hiker.bestValue) {
        hiker.bestValue = hiker.brain.fitness;
        hiker.bestPosition = [...hiker.position];
      }

      if (hiker.brain.fitness > this.bestValue) {
        this.bestValue = hiker.brain.fitness;
        this.bestPosition = [...hiker.position];
      }
    }
  }

  #moveHikers() {
    for (const hiker of this.hikers) {
      const theta = Math.random() * 50; // random elevation 0–50°
      const slope = this.#slope(theta);
      const WiPrev = this.#toblersVelocity(slope);

      const alpha = 1 + Math.random() * 2; // [1,3]
      const gamma = Math.random(); // [0,1]

      const Wi = hiker.position.map(
        (pos, i) => WiPrev + gamma * (this.bestPosition[i] - alpha * pos)
      );

      hiker.velocity = Wi;
      hiker.move();
      hiker.brain.params = [...hiker.position];
    }
  }

  #saveHistory() {
    this.history.bestFitness.push(this.bestValue);
    this.history.bestPosition.push([...this.bestPosition]);
  }

  endIter(verbose = true) {
    this.#evaluateHikers();
    this.#moveHikers();
    this.#saveHistory();

    // === Optional Verbose Logging ===
    if (verbose) {
      console.log(
        `Best=${this.bestValue.toFixed(6)}, Pos=[${this.bestPosition
          .map((x) => x.toFixed(3))
          .join(", ")}]`
      );
    }

    // === Store per generation ===
    const generation = parseInt(localStorage.getItem("generation")) || 0;
    let carsHistory = (localStorage.getItem('carsHistory') == undefined) ? {} :  JSON.parse(localStorage.getItem('carsHistory'));


    const hikersData = this.hikers.map((hiker, index) => {
      const riseTimeAverage = calculateAverage(
        hiker.brain.stepResponseResult.riseTime
      );
      const settlingTimeAverage = calculateAverage(
        hiker.brain.stepResponseResult.settlingTime
      );
      const overshootAverage = calculateAverage(
        hiker.brain.stepResponseResult.overshoot
      );
      const overshootPercentageAverage = calculateAverage(
        hiker.brain.stepResponseResult.overshootPercentage
      );

      return {
        [`hiker${index}`]: {
          params: hiker.brain.params,
          fitness: hiker.brain.fitness,
          riseTime: riseTimeAverage,
          settlingTime: settlingTimeAverage,
          overshoot: overshootAverage,
          overshootPercentage: overshootPercentageAverage,
        },
      };
    });

    const sortedHikers = this.hikers.sort((h1, h2) => h2.brain.fitness - h1.brain.fitness);
    const bestHiker = sortedHikers[0];

    localStorage.setItem(
      "bestHikerParams",
      JSON.stringify(bestHiker.brain)
    );

    carsHistory[`gen${generation}`] = hikersData;
    localStorage.setItem("carsHistory", JSON.stringify(carsHistory));

    let generationArr = JSON.parse(localStorage.getItem("generationArr")) || [];
    generationArr.push(generation);
    localStorage.setItem("generationArr", JSON.stringify(generationArr));

    let fitnessArr = JSON.parse(localStorage.getItem("fitnessArr")) || [];
    fitnessArr.push(bestHiker.brain.fitness);
    localStorage.setItem("fitnessArr", JSON.stringify(fitnessArr));

    // Save new gene for next generation
    const gene = this.hikers.map((hiker) => ({ brain: hiker.brain }));
    localStorage.setItem("gene", JSON.stringify(gene));
  }
}


// === Helper: Mean ===
function calculateAverage(values) {
  if (!values || values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
