
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
    constructor(controller, evaluator) {
        this.stepResponseResult = {
            riseTime: [],
            settlingTime: [],
            overshoot: [],
            overshootPercentage: []
        };

        this.controller = controller;
        // this.evaluator = new

        // Use to receive the error sent by the sensors
        // this.adcError = [0];
        // this.avcError = [0];
        
        // Fitness is used to define how 'good' the model performs
        // this.ff = 0; // this is the result from the objective function
        // this.fitness = 100000;
        this.obj_val = 0;

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
            overshoot = null;
        }
        return overshoot;
    }
    accUpdate(Vego, Vlead, Vset, Xego, Xlead, Ddef) { 
        // Define constants
        const Ddef      = 20; // Ini seharusnya 25 meter sebagai jarak default (Karena perubahan ke pixel)
        const Tg        = 1.2; // Ini seharusnya 1.2 sekon (Karena perubahan ke fps)

        // Measure safe distance
        d_safe          = Ddef + Vego * 1.5;

        // Calculate errors
        d_err           = d_safe  - (Xlead - Xego);
        v_err           = Vset - Vego;
        v_rel           = Vlead - Vego;

        // Aggregate errors for fitness calculation
        this.obj_val    += this.evaluator(d_err, this.time.length) + this.evaluator(v_err, this.time.length);

        // Calculate control command
        this.u          = this.controller.calculateCommand(d_err, v_err, v_rel);
        return this.u;
    }
}