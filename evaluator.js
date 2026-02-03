class Evaluator {
    constructor() {
        this.w_dist = 20.6537;
        this.w_vel =  1.74043;
    }
    
    static iae = (e) => {
        return Math.abs(e) 
    }

    static ise = (e) => {
        return e * e
    }

    static itae = (e, t) => {
        return Math.abs(e) * t;
    }

    static itse = (e, t) => {
        return e * e * t;
    }

    computeFitness(derr, verr, time, objFunc) {
        let J = this.w_dist * objFunc(derr, time) + this.w_vel * objFunc(verr, time);
        return J;
    }
}