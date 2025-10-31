class Particle {
  constructor(minParams, maxParams, position, brain, dimensions = 3) {
    this.brain = brain
    this.minParams = minParams;
    this.maxParams = maxParams;
    this.position = position
    this.velocity = Array(dimensions).fill(0);
    this.bestPosition = [...this.position];
    this.bestValue = -10000;
  }

  move() {
    this.position = this.position.map((pos, i) => {
      let newPos = pos + this.velocity[i];
      return Math.min(Math.max(newPos, this.minParams[i]), this.maxParams[i]);
    });
  }
}

class ParticleSwarmOptimization {
  constructor(particles, minParams=[-5, -5, -5], maxParams=[5, 5, 5], {
    nParticles = 30,
    maxIteration = 100,
    w = 0.7,
    c1 = 1.4,
    c2 = 1.2,
    tolerance = 1e-6
  } = {}) {
    this.nParticles = nParticles;
    this.maxIteration = maxIteration;
    this.particles = particles.map(p => new Particle(minParams, maxParams, p.brain.params, p.brain, minParams.length));
    this.bestValue = -10000;
    this.bestPosition = Array(minParams.length).fill(0);
    this.w = w;
    this.c1 = c1;
    this.c2 = c2;
    this.tolerance = tolerance;

    // Tracking
    this.history = {
      bestFitness: [],
      bestPosition: []
    };
  }

  #evaluateParticles() {
    for (const particle of this.particles) {

      if (particle.brain.fitness > particle.bestValue) {
        particle.bestValue = particle.brain.fitness;
        particle.bestPosition = [...particle.position];
      }

      if (particle.brain.fitness > this.bestValue) {
        this.bestValue = particle.brain.fitness;
        this.bestPosition = [...particle.position];
      }
    }
  }

  #moveParticles() {
    for (const particle of this.particles) {
      const r1 = Math.random();
      const r2 = Math.random();

      const cognitive = particle.bestPosition.map(
        (bp, i) => this.c1 * r1 * (bp - particle.position[i])
      );
      const social = this.bestPosition.map(
        (gb, i) => this.c2 * r2 * (gb - particle.position[i])
      );

      particle.velocity = particle.velocity.map(
        (v, i) => this.w * v + cognitive[i] + social[i]
      );

      particle.move();
      particle.brain.params = [...particle.position];
    }
  }

  #saveHistory() {
    this.history.bestFitness.push(this.bestValue);
    this.history.bestPosition.push([...this.bestPosition]);
  }

  endIter(verbose = true) {
    console.log(`check fitness: ${this.particles[0].brain.fitness}`);
    this.#evaluateParticles();
    this.#moveParticles();
    this.#saveHistory();

    // if (verbose) {
    //     console.log(
    //         `Iter ${iter}: Best=${this.bestValue.toFixed(6)} Pos=[${this.bestPosition.map(x => x.toFixed(4)).join(', ')}]`
    //     );
    // }

    if (Math.abs(this.bestValue) < this.tolerance) {
        console.log("Converged early.");
    }

    // Updates the history
    const generation = parseInt(localStorage.getItem('generation'));
    let carsHistory = (localStorage.getItem('carsHistory') == undefined) ? {} :  JSON.parse(localStorage.getItem('carsHistory'));

    this.particles = this.particles.sort((p1, p2) => p2.brain.fitness - p1.brain.fitness);
    const best = this.particles[0];

    const carsData = [...this.particles].map((particle, index) => {
        const riseTimeAverage = calculateAverage(particle.brain.stepResponseResult.riseTime);
        const settlingTimeAverage = calculateAverage(particle.brain.stepResponseResult.settlingTime);
        const overshootAverage = calculateAverage(particle.brain.stepResponseResult.overshoot);
        const overshootPercentageAverage = calculateAverage(particle.brain.stepResponseResult.overshootPercentage);
      
        return {
            [`car${index}`]: {
                params: particle.brain.params,
                fitness: particle.brain.fitness,
                riseTime: riseTimeAverage,
                settlingTime: settlingTimeAverage,
                overshoot: overshootAverage,
                overshootPercentage: overshootPercentageAverage
            }
        };
    });

    localStorage.setItem('bestCarParams', JSON.stringify(this.particles[this.particles.length - 1].brain.params))

    carsHistory[`gen${generation}`] = carsData;
    localStorage.setItem('carsHistory', JSON.stringify(carsHistory));

    generationArr.push(generation);
    localStorage.setItem('generationArr', generationArr);

    fitnessArr.push(this.bestValue);
    localStorage.setItem('fitnessArr', fitnessArr)

    // Update the gene that will be used in the next generation
    const gene = this.particles.map(particle => ({ brain: particle.brain }));
    localStorage.setItem('gene', JSON.stringify(gene));

    // return { bestPosition: this.bestPosition, bestValue: this.bestValue };
  }
}