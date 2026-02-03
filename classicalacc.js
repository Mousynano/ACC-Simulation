class ClassicalACC {
    constructor({kve, kvrel, kde} = {}){
        this.kve = kve || 0.5;      // Gain for velocity error
        this.kvrel = kvrel || 0.3;   // Gain for relative velocity
        this.kde = kde || 0.2;      // Gain for distance error
    }

    calculateCommand(derr, verr, vrel){
        u_v = this.kve * verr;
        u_d = (this.kvrel * vrel) + (this.kde * derr);
        u = Math.min(u_v, u_d)
        return u;
    }
}