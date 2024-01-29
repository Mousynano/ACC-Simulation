
/*
This file is part of Smart Car Simulations.
Smart Car Simulations is free software: you can redistribute it and/or modify it under the terms 
of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Smart Car Simulations is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Foobar. 
If not, see <https://www.gnu.org/licenses/>.
*/

// Bagian yang mungkin perlu diperbaiki ada di method/fungsi accUpdate() dan calculatePID()

// This class is used for the adaptive cruise control system
class AdaptiveCruiseControl {
    constructor() {
        // It requires the parameters to be randomized if we're working with GA
        this.kp = Math.random();
        this.ki = Math.random();
        this.kd = Math.random();

        // If we already  trained the parameters previously, we can define them here.
        // Use only one piece of the code by commenting this or the code above.
        // this.kp = 0.87;
        // this.ki = 0.001;
        // this.kd = 0.01; 
        
        this.stepResponseResult = {
            riseTime: [],
            settlingTime: [],
            overshoot: [],
            overshootPercentage: []
        };

        // Use to receive the error sent by the sensors
        this.adcError = [0];
        this.avcError = [0];
        
        // Fitness is used to define how 'good' the model performs
        this.ff = 0; // this is the result from the objective function
        this.fitness = 100000;

        //This pid is used to change the acceleration, which then change the velocity and so on
        this.pid = 0;

        this.time = [];
    }

    updateStepResponseData(error) {
        this.stepResponseResult.riseTime.push(this.findRiseTime(error));
        this.stepResponseResult.settlingTime.push(this.findSettlingTime(error));

        const overshoot = this.findOvershoot(error);
        this.stepResponseResult.overshoot.push(overshoot);
        this.stepResponseResult.overshootPercentage.push((overshoot / error[1]) * 100);
    }
      

    findSettlingTime(error) {
        let errorArr = error.map(Math.abs);
        let settledError, settledIndex;
    
        for (let i = 1; i < errorArr.length; i++) {
            if (((errorArr[i] / errorArr[1]) * 100) >= 0.02) {
                settledError = errorArr[i];
            }
        }
        // console.log(`settledError: ${settledError}`);
    
        settledIndex = errorArr.findIndex(e => e == settledError);
        return this.time[settledIndex] - this.time[1];
    }
    
      
    findRiseTime(error, startPercentile = 0.9, endPercentile = 0.1) {
        let errorArr = error.map(Math.abs);
        const startIndex = error.findIndex(x => x <= error[1] * startPercentile);
        const endIndex = error.findIndex(e => e >= error[1] * endPercentile);
      
        // Pastikan indeks yang ditemukan adalah valid sebelum mengakses array
        if (startIndex !== -1 && endIndex !== -1) {
            const startValue = this.time[startIndex];
            const endValue = this.time[endIndex]; // Kembalikan urutan array ke semula
            return Math.abs(endValue - startValue);
        } else {
            // console.error("Indeks tidak ditemukan.");
            return null;
        }
    }
      
      
    findOvershoot(error) {
        // Menetapkan nilai setpoint, misalnya, sebagai nilai terendah dari respons
        const setpoint = Math.min(...error);
    
        let valleys = [];
        let overshoot;
    
        // Pencarian lembah
        for (let i = 1; i < error.length - 1; i++) {
            if ((error[i] < error[i - 1] && error[i] < error[i + 1]) || (error[i] < error[i - 1] && error[i] < error[i + 2])) {
                valleys.push(i);
                if (valleys.length === 2) {
                    break;
                }
            }
        }
    
        // Pencarian overshoot
        if (valleys.length === 2) {
            overshoot = Math.max(...error.slice(valleys[0], valleys[1] + 1));
        } else {
            overshoot = null; // Atau nilai lain yang sesuai dengan konteks
        }
        return overshoot;
    }
    accUpdate(Vego, Vlead, Vset, Xego, Xlead, Dsafe) { 
        // console.log(`Vego: ${Vego}; Vlead: ${Vlead}; Vset: ${Vset}; Xego: ${Xego}; Xlead: ${Xlead}; Dsafe: ${Dsafe}`)
        this.time.push(time);
        // These are the errors for both condition.
        // avc is the speed control and adc is the distance control
        let avc = Vset - Vego;
        let adc = (Vlead - Vego) - (Dsafe - Math.abs(Xlead - Xego));

        // The error float is limited to 13 digits after comma to avoid javascript LSB digit error
        avc = parseFloat(avc.toFixed(13));
        adc = parseFloat(adc.toFixed(13));

        // The error the being pushed to the array to calculate the sum
        this.adcError.push(adc);
        this.avcError.push(avc);

        // Here is the sum, it will then be used to calculate the output from the I in integration block from PID
        const sumErrorAvc = this.avcError.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        const sumErrorAdc = this.adcError.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

        // Get the PID result with the given error
        const pidAvc = this.calculatePID(avc, this.avcError[this.avcError.length - 2], sumErrorAvc);
        const pidAdc = (Vlead == undefined) ? (pidAvc + 1) : this.calculatePID(adc, this.adcError[this.adcError.length - 2], sumErrorAdc);

        // Defines which is smaller. If smaller then it will be used by the model
        if(pidAvc < pidAdc){
            // console.log('avc');
            if (this.adcError.length > 2){
                this.updateStepResponseData(this.adcError);
                this.time = [0];
            }
            this.adcError = [0];
            this.pid = pidAvc;
            switch (objectiveFunction){
                case 'IAE':
                    this.ff += parseFloat((iae(avc)).toFixed(13));
                    break;
                case 'ISE':
                    this.ff += parseFloat((ise(avc)).toFixed(13));
                    break;
                case 'ITAE':
                    this.ff += parseFloat((itae(avc), time).toFixed(13), time);
                    break;
                case 'ITSE':
                    this.ff += parseFloat((itse(avc, time)).toFixed(13), time);
                    break;
            }
        }else{
            // console.log('adc')
            if (this.avcError.length > 2){
                this.updateStepResponseData(this.avcError);
                this.time = [0];
            }
            this.avcError = [0];
            this.pid = pidAdc;
            switch (objectiveFunction){
                case 'IAE':
                    this.ff += parseFloat((iae(adc)).toFixed(13));
                    break;
                case 'ISE':
                    this.ff += parseFloat((ise(adc)).toFixed(13));
                    break;
                case 'ITAE':
                    this.ff += parseFloat((itae(adc, time)).toFixed(13));
                    break;
                case 'ITSE':
                    this.ff += parseFloat((itse(adc, time)).toFixed(13));
                    break;
            }
        }

        // Calculate the fitness from the objective function
        this.fitness = 100000 / this.ff
        // console.log(`ff: ${this.ff}`);
    }

    calculatePID(error, prevError, sumError){
        // Calculate each block
        let P = this.kp * error;
        let I = this.ki * sumError;
        let D = this.kd * (error - prevError);

        // Sum all of the block
        let pid = (P + I + D);

        // Apply threshod to the acceleration
        if (pid < minAcceleration){
            pid = minAcceleration;
        }else if (pid > maxAcceleration){
            pid = maxAcceleration;
        }

        // Pass to update the pid
        return pid;
    }
}