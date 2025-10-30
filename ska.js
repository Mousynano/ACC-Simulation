class Komodo {
  constructor(minParams, maxParams, position, dimensions = 3) {
    this.minParams = minParams;
    this.maxParams = maxParams;
    this.position = position;
    this.dimensions = dimensions;
    this.fitness = -Infinity;
    this.bestPosition = [...position];
    this.bestValue = -Infinity;
  }
}

class StochasticKomodoAlgorithm {
  constructor(
    komodos,
    minParams = [-5, -5, -5],
    maxParams = [5, 5, 5],
    {
      popSize = 30,
      maxIter = 100,
      g1 = 0.35,
      g2 = 0.7,
      w1 = 0.5,
      w2 = 0.5,
      rs = 0.01,
      nC = 5,
      maximize = true,
    } = {}
  ) {
    this.popSize = popSize;
    this.maxIter = maxIter;
    this.g1 = g1;
    this.g2 = g2;
    this.w1 = w1;
    this.w2 = w2;
    this.rs = rs;
    this.nC = nC;
    this.maximize = maximize;

    this.minParams = minParams;
    this.maxParams = maxParams;
    this.dimensions = minParams.length;

    this.komodos = komodos.map(
      (k) => new Komodo(minParams, maxParams, k.brain.params, minParams.length)
    );

    this.bestValue = -Infinity;
    this.bestPosition = Array(this.dimensions).fill(0);

    this.history = {
      bestFitness: [],
      bestPosition: [],
    };
  }

  // === Big Male Movement ===
  #bigMaleMove(k_i, population, f_values) {
    const f_i = k_i.fitness;
    const better = population.filter((_, idx) => f_values[idx] > f_i);
    if (better.length === 0) return k_i.position;

    const meanBetter = Array(this.dimensions)
      .fill(0)
      .map(
        (_, j) =>
          better.reduce((sum, k) => sum + k.position[j], 0) / better.length
      );

    const newPos = Array(this.dimensions)
      .fill(0)
      .map(
        (_, j) =>
          this.w1 * k_i.position[j] + (1 - this.w1) * meanBetter[j]
      );

    return newPos.map((v, j) =>
      Math.min(Math.max(v, this.minParams[j]), this.maxParams[j])
    );
  }

  // === Female (Parthenogenesis) ===
  #generateCandidates(k_i) {
    const candidates = [];
    for (let i = 0; i < this.nC; i++) {
      const c = k_i.position.map(
        (v, j) =>
          v +
          (Math.random() - 0.5) *
            this.rs *
            (this.maxParams[j] - this.minParams[j])
      );
      candidates.push(
        c.map((v, j) =>
          Math.min(Math.max(v, this.minParams[j]), this.maxParams[j])
        )
      );
    }
    return candidates;
  }

  // === Small Male Movement ===
  #smallMaleMove(k_i) {
    const newPos = k_i.position.map(
      (v, j) =>
        this.w2 * v + (1 - this.w2) * this.bestPosition[j]
    );
    return newPos.map((v, j) =>
      Math.min(Math.max(v, this.minParams[j]), this.maxParams[j])
    );
  }

  #saveHistory() {
    this.history.bestFitness.push(this.bestValue);
    this.history.bestPosition.push([...this.bestPosition]);
  }

  endIter(verbose = true) {
    const f_values = this.komodos.map((k) => k.fitness);

    for (let i = 0; i < this.popSize; i++) {
      const r = Math.random();
      const komodo = this.komodos[i];
      let newPos = [...komodo.position];

      if (r < this.g1) {
        newPos = this.#bigMaleMove(komodo, this.komodos, f_values);
      } else if (r < this.g2) {
        const C = this.#generateCandidates(komodo);
        // ambil kandidat terbaik
        let bestC = C[0];
        let bestF = -Infinity;
        for (const cand of C) {
          const fit = this.evaluate(cand);
          if (fit > bestF) {
            bestF = fit;
            bestC = cand;
          }
        }
        if (bestF > komodo.fitness) newPos = bestC;
      } else {
        newPos = this.#smallMaleMove(komodo);
      }

      // evaluasi posisi baru
      const newFitness = this.evaluate(newPos);
      if (newFitness > komodo.fitness) {
        komodo.position = newPos;
        komodo.fitness = newFitness;
      }

      if (komodo.fitness > this.bestValue) {
        this.bestValue = komodo.fitness;
        this.bestPosition = [...komodo.position];
      }
    }

    this.#saveHistory();

    if (verbose) {
      console.log(
        `Best=${this.bestValue.toFixed(6)}, Pos=[${this.bestPosition
          .map((x) => x.toFixed(3))
          .join(", ")}]`
      );
    }

    // === Penyimpanan data ke localStorage ===
    const generation = parseInt(localStorage.getItem("generation")) || 0;
    let komodoHistory =
      localStorage.getItem("komodoHistory") === undefined
        ? {}
        : JSON.parse(localStorage.getItem("komodoHistory"));

    const komodoData = this.komodos.map((komodo, index) => {
      const riseTimeAverage = calculateAverage(
        komodo.brain.stepResponseResult.riseTime
      );
      const settlingTimeAverage = calculateAverage(
        komodo.brain.stepResponseResult.settlingTime
      );
      const overshootAverage = calculateAverage(
        komodo.brain.stepResponseResult.overshoot
      );
      const overshootPercentageAverage = calculateAverage(
        komodo.brain.stepResponseResult.overshootPercentage
      );

      return {
        [`komodo${index}`]: {
          params: komodo.brain.params,
          fitness: komodo.fitness,
          riseTime: riseTimeAverage,
          settlingTime: settlingTimeAverage,
          overshoot: overshootAverage,
          overshootPercentage: overshootPercentageAverage,
        },
      };
    });

    localStorage.setItem(
      "bestKomodoParams",
      JSON.stringify(this.komodos[this.komodos.length - 1].brain)
    );

    komodoHistory[`gen${generation}`] = komodoData;
    localStorage.setItem("komodoHistory", JSON.stringify(komodoHistory));

    let generationArr = JSON.parse(localStorage.getItem("generationArr")) || [];
    generationArr.push(generation);
    localStorage.setItem("generationArr", JSON.stringify(generationArr));

    let fitnessArr = JSON.parse(localStorage.getItem("fitnessArr")) || [];
    fitnessArr.push(this.bestValue);
    localStorage.setItem("fitnessArr", JSON.stringify(fitnessArr));

    // simpan gen baru
    const gene = this.komodos.map((k) => ({ brain: k.brain }));
    localStorage.setItem("gene", JSON.stringify(gene));
  }

  evaluate(position) {
    // fungsi fitness sistem kamu (misal dari simulasi PID/ACC)
    // di sini bisa disesuaikan agar memanggil lean_simulate_system
    // atau sistem lain
    if (typeof leanSimulateSystem === "function") {
      return leanSimulateSystem(position);
    }
    return -position.reduce((sum, x) => sum + x ** 2, 0); // fallback dummy fitness
  }
}


// === Helper ===
function calculateAverage(values) {
  if (!values || values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
