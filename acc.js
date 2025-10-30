
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
        // this.params = [Math.random(), Math.random(), Math.random()];
        this.params = [3.4072, 0.0339, 2.3588]
        // [ 2.8634,  0.0431, -2.6774]
        // this.kp = Math.random();
        // this.ki = Math.random();
        // this.kd = Math.random();

        // If we already  trained the parameters previously, we can define them here.
        // Use only one piece of the code by commenting this or the code above.

        // [this.kp, this.ki, this.kd] =  [5.12, 0.0791631, 5.12] // Dynamic PSO, Good
        // [this.kp, this.ki, this.kd] = [-5.11998517, 0.91765704, 5.11988597] // Static PSO, Bad
        // [this.kp, this.ki, this.kd] = [5.12, 0.07874045, -5.12]; // Dynamic KMA, Bad
        // [this.kp, this.ki, this.kd] = [5.12, 0.07874045, -5.12]; // Static KMA, Terrible
        // [this.kp, this.ki, this.kd] =  [ 10, 0.15423675, -10]; // Dynamic KMA, Bad
        // [this.kp, this.ki, this.kd] = [10, 0.15892311, -3.8215778]
        // [this.kp, this.ki, this.kd] = [ 10.,           0.15826383, -10.        ]
        // [this.kp, this.ki, this.kd] = [10.0, 0.8628822294359882, 10.0]
        // [this.kp, this.ki, this.kd] = [1.1049840202064238, 0.19825546300634767, 0.25617854167529375] // GA, Terrible 

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

    accUpdate(Vego, Vlead, Vset, Xego, Xlead, Dsafe, t /* pass current sim time */) {
        const round13 = (x) => Number.isFinite(x) ? Math.round(x * 1e13) / 1e13 : 0;

        // --- init state
        if (!this.time) this.time = [0];
        if (!this.avcError) this.avcError = [];
        if (!this.adcError) this.adcError = [];
        if (this.sumAvc === undefined) this.sumAvc = 0;
        if (this.sumAdc === undefined) this.sumAdc = 0;
        if (this.prevAvc === undefined) this.prevAvc = 0;
        if (this.prevAdc === undefined) this.prevAdc = 0;
        if (this.ff === undefined || !Number.isFinite(this.ff)) this.ff = 0; // <-- FIX #1

        // --- push time (use provided t, not undefined "time")
        this.time.push(t); // <-- FIX #2

        // --- compute errors safely
        const safe = (v, d=0) => (Number.isFinite(v) ? v : d);
        Vego  = safe(Vego);
        Vlead = (Vlead == null) ? null : safe(Vlead);
        Vset  = safe(Vset);
        Xego  = safe(Xego);
        Xlead = safe(Xlead);
        Dsafe = safe(Dsafe);

        let avc = round13(Vset - Vego);
        let adc = (Vlead == null)
            ? 0 // won’t be used if Vlead == null
            : round13((Vlead - Vego) - (Dsafe - Math.abs(Xlead - Xego)));

        // --- update sums
        this.avcError.push(avc);
        this.sumAvc += avc;

        if (Vlead != null) {
            this.adcError.push(adc);
            this.sumAdc += adc;
        }

        const prevAvc = (this.avcError.length > 1) ? this.prevAvc : 0;
        const prevAdc = (this.adcError.length > 1) ? this.prevAdc : 0;

        // --- PID
        const pidAvc = this.calculatePID(avc, prevAvc, this.sumAvc);
        const pidAdc = (Vlead == null) ? (pidAvc + 1) : this.calculatePID(adc, prevAdc, this.sumAdc);

        // guard NaN
        const finiteAvc = Number.isFinite(pidAvc) ? pidAvc : Number.POSITIVE_INFINITY;
        const finiteAdc = Number.isFinite(pidAdc) ? pidAdc : Number.POSITIVE_INFINITY;

        const useAvc = finiteAvc <= finiteAdc; // <-- FIX #3: compare finite

        if (useAvc) {
            if (this.adcError.length > 2) {
            this.updateStepResponseData(this.adcError);
            this.time = [0];
            }
            // reset ADC buffers + prev
            this.sumAdc = 0;
            this.adcError = [0];
            this.prevAdc = 0; // <-- FIX #4

            this.pid = finiteAvc;

            switch (objectiveFunction) {
            case 'IAE':  this.ff += round13(iae(avc)); break;
            case 'ISE':  this.ff += round13(ise(avc)); break;
            case 'ITAE': this.ff += round13(itae(avc, t)); break;   // <-- use t
            case 'ITSE': this.ff += round13(itse(avc, t)); break;   // <-- use t
            }
        } else {
            if (this.avcError.length > 2) {
            this.updateStepResponseData(this.avcError);
            this.time = [0];
            }
            // reset AVC buffers + prev
            this.sumAvc = 0;
            this.avcError = [0];
            this.prevAvc = 0; // <-- FIX #4

            this.pid = finiteAdc;

            switch (objectiveFunction) {
            case 'IAE':  this.ff += round13(iae(adc)); break;
            case 'ISE':  this.ff += round13(ise(adc)); break;
            case 'ITAE': this.ff += round13(itae(adc, t)); break;   // <-- use t
            case 'ITSE': this.ff += round13(itse(adc, t)); break;   // <-- use t
            }
        }

        // prev errors
        this.prevAvc = avc;
        this.prevAdc = (Vlead == null) ? 0 : adc;

        // fitness: avoid div-by-zero / NaN
        const denom = (Number.isFinite(this.ff) && this.ff !== 0) ? this.ff : Number.EPSILON;
        this.fitness = 10000 / denom; // or: this.fitness = 1 / (1 + this.ff);
    }


    calculatePID(error, prevError, sumError){
        // Calculate each block
        let P = this.params[0] * error;
        let I = this.params[1] * sumError;
        let D = this.params[2] * (error - prevError);

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