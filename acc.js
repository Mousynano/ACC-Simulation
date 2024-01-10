class AdaptiveCruiseControl {
    constructor() {
        this.kp = Math.random() * 2;
        this.ki = Math.random() * 2;
        this.kd = Math.random() * 2; 
        this.avc = new ActiveVelocityControl(this);
        this.adc = new ActiveDistanceControl(this);
        this.currentControl = null;
        this.ff = 0;
        this.fitness = 10000;
        this.pid = 0;
    }

    static resetHistory(control) {
        control.errorHistory = [0];
        control.index = 1;
    }

    static accUpdate(speed, distance, safeDistance, leadCarNow, desiredSpeed, acc) {
        if ((safeDistance < distance) || (distance == 0)) {
            ActiveVelocityControl.avcUpdate(speed, desiredSpeed, acc.avc);
            ActiveDistanceControl.adcUpdate(speed, distance, safeDistance, leadCarNow, acc.adc);
    
            if (acc.adc.pid > acc.avc.pid) {
                // console.log("avc if")
                AdaptiveCruiseControl.resetHistory(acc.adc);
                acc.currentControl = acc.avc;
                acc.pid = acc.avc.pid;
                acc.ff += acc.avc.ff;
                acc.fitness = 10000 / acc.ff;
            } else {
                // console.log('adc if')
                AdaptiveCruiseControl.resetHistory(acc.avc);
                acc.currentControl = acc.adc;
                acc.pid = acc.adc.pid;
                acc.ff += acc.adc.ff
                acc.fitness = 10000 / acc.ff;
            }
    
            acc.pid = Math.min(acc.adc.pid, acc.avc.pid);
        } else if ((safeDistance > distance) && (distance != 0)) {
            // console.log('adc else if')
            ActiveDistanceControl.adcUpdate(speed, distance, safeDistance, leadCarNow, acc.adc);
            AdaptiveCruiseControl.resetHistory(acc.avc);
            
            acc.currentControl = acc.adc;
            acc.pid = acc.adc.pid;
            acc.ff += acc.adc.ff;
            acc.fitness = 10000 / acc.ff;
        }
        // console.log('fitness: ' + acc.fitness);
    
        return [acc.pid, acc.fitness];
    }
    
    // static mutate(control, amount=mutationRange) {
    //     console.log("mutasi")
    //     control.kp = lerp(control.kp, (Math.random() * 2) - 1, amount);
    //     control.ki = lerp(control.ki, (Math.random() * 2) - 1, amount);
    //     control.kd = lerp(control.kd, (Math.random() * 2) - 1, amount);
    // }

    static calculatePID(currentControl, sumError){
        let P = currentControl.kp * currentControl.errorHistory[currentControl.index];
        let I = currentControl.ki * sumError;
        let D = (currentControl.index == 0) ? (currentControl.kd * currentControl.errorHistory[currentControl.index]) : (currentControl.kd * (currentControl.errorHistory[currentControl.index] - currentControl.errorHistory[currentControl.index - 1]))
        let pid = (P + I + D);
        if (pid < minAcceleration){
            pid = minAcceleration;
        }else if (pid > maxAcceleration){
            pid = maxAcceleration;
        }
        currentControl.pid = pid;
        currentControl.index += 1;
    }
}


class ActiveVelocityControl {
    constructor(params){
        this.kp = params.kp;
        this.ki = params.ki;
        this.kd = params.kd;

        this.errorHistory = [0];
        this.oscillation = [];
        this.index = 1;
        this.ff = 0;
        this.pid = 0;
    }

    static #calculateError(index, errorHistory, speed, desiredSpeed){
        let error = desiredSpeed - speed;
        error = parseFloat(error.toPrecision(13));
        errorHistory[index] = error;
        let sumError = errorHistory.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        return sumError;
    }

    static avcUpdate(speed, desiredSpeed, currentControl){
        const sumError = this.#calculateError(currentControl.index, currentControl.errorHistory, speed, desiredSpeed);
        currentControl.ff = iae(currentControl.errorHistory[currentControl.index]);
        currentControl.ff = parseFloat((currentControl.ff).toPrecision(13));
        // console.log('ff: ' + currentControl.ff);
        AdaptiveCruiseControl.calculatePID(currentControl, sumError);
    }
}
// 0.5000000000000027
class ActiveDistanceControl {
    constructor(params){
        this.kp = params.kp;
        this.ki = params.ki;
        this.kd = params.kd;

        this.errorHistory = [0];
        this.oscillation = [];
        this.index = 1;
        this.pid = 0;
        this.ff = 0;
        this.leadCarPos = [];
    }

    static #calculateError(index, leadCarPos, errorHistory, leadCarNow, safeDistance, distance, speed){
        leadCarPos[0] = leadCarPos[1];
        leadCarPos[1] = leadCarNow;
        const VelRel = (leadCarPos[0] - leadCarPos[1]) - speed;
        let error = VelRel - (safeDistance - distance);
        error = parseFloat(error.toPrecision(13));
        errorHistory[index] = error;
        const sumError = errorHistory.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        return sumError;
    }

    static adcUpdate(speed, distance, safeDistance, leadCarNow, currentControl){
        if (currentControl.leadCarPos.length != 0){
            const sumError = this.#calculateError(currentControl.index, currentControl.leadCarPos, currentControl.errorHistory, leadCarNow, safeDistance, distance, speed);
            currentControl.ff = iae(currentControl.errorHistory[currentControl.index]);
            AdaptiveCruiseControl.calculatePID(currentControl, sumError);
        }else{
            currentControl.leadCarPos[1] = leadCarNow;
        }
    }
}