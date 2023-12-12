class AdaptiveCruiseControl {
    constructor() {
        this.avc = new ActiveVelocityControl();
        this.adc = new ActiveDistanceControl();
        this.currentControl = null;
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
    
            // Memilih control yang memiliki nilai PID lebih rendah
            if (acc.adc.pid > acc.avc.pid) {
                AdaptiveCruiseControl.resetHistory(acc.adc);
                acc.currentControl = acc.avc;
                acc.pid = acc.avc.pid;
                // acc.fitness = 10000 / acc.avc.ff;
            } else {
                AdaptiveCruiseControl.resetHistory(acc.avc);
                acc.currentControl = acc.adc;
                acc.pid = acc.adc.pid;
                // acc.fitness = 10000 / acc.adc.ff;
            }
    
            acc.pid = Math.min(acc.adc.pid, acc.avc.pid);
        } else if ((safeDistance > distance) && (distance != 0)) {
            // Jika safeDistance > distance && distance != 0, hanya update adc
            ActiveDistanceControl.adcUpdate(speed, distance, safeDistance, leadCarNow, acc.adc);
            
            // Reset history avc karena tidak digunakan
            AdaptiveCruiseControl.resetHistory(acc.avc);
            
            // Set currentControl menjadi adc
            acc.currentControl = acc.adc;
            acc.pid = acc.adc.pid;
            // acc.fitness = 10000 / acc.adc.ff;
        }
        // console.log("fitness = " + acc.fitness);
        acc.fitness = 10000 / ((acc.adc.ff + acc.avc.ff) / 2);
    
        return acc.pid;
    }
    
    static mutate(control, amount=mutationRange) {
        console.log("mutasi")
        control.kp = lerp(control.kp, (Math.random() * 2) - 1, amount);
        control.ki = lerp(control.ki, (Math.random() * 2) - 1, amount);
        control.kd = lerp(control.kd, (Math.random() * 2) - 1, amount);
    }

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
    constructor(){
        this.kp = 1; 
        this.ki = 1;
        this.kd = 1;

        this.errorHistory = [0];
        this.oscillation = [];
        this.index = 1;
        this.ff = 0;
        this.pid = 0;
    }

    static #calculateError(index, errorHistory, speed, desiredSpeed){
        errorHistory[index] = desiredSpeed - speed;
        let sumError = errorHistory.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        return sumError;
    }

    static avcUpdate(speed, desiredSpeed, currentControl){
        const sumError = this.#calculateError(currentControl.index, currentControl.errorHistory, speed, desiredSpeed);
        currentControl.ff += itse(currentControl.errorHistory[currentControl.index], time);
        // console.log("ff avc: " + currentControl.ff);
        AdaptiveCruiseControl.calculatePID(currentControl, sumError);
    }
}

class ActiveDistanceControl {
    constructor(){
        this.kp = 1; 
        this.ki = 1;
        this.kd = 1;

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
        errorHistory[index] = VelRel - (safeDistance - distance);
        const sumError = errorHistory.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        return sumError;
    }

    static adcUpdate(speed, distance, safeDistance, leadCarNow, currentControl){
        if (currentControl.leadCarPos.length != 0){
            const sumError = this.#calculateError(currentControl.index, currentControl.leadCarPos, currentControl.errorHistory, leadCarNow, safeDistance, distance, speed);
            currentControl.ff += itse(currentControl.errorHistory[currentControl.index], time);
            // console.log("ff adc: " + currentControl.ff)
            AdaptiveCruiseControl.calculatePID(currentControl, sumError);
        }else{
            currentControl.leadCarPos[1] = leadCarNow;
        }
    }
}