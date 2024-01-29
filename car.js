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

// This class is to define the car model
class Car{
    // It will require thex and y where it will be spawned, the length dimension for the size,
    // the control used by the model, the max velocity and the color
    constructor(x, y, width, height, controlType, maxSpeed=maxVelocity, color=getRandomColor()){

        this.leadYR = [undefined, undefined];

        this.fitness = 10000;
        this.controlType = controlType;

        this.fr = 0.05;
        this.ar = 0;
        this.av = 0;
        this.vr = (this.controlType == "DUMMY") ? 22 : 25;
        this.xv = x;
        this.yv = y;
        this.width = width;
        this.height = height;

        this.maxSpeed = maxSpeed;
        this.theta = 0;
        this.angle = 0;
        this.damaged = false;

        this.controls = new Controls(controlType);

        this.delaySpeedSensor = 0;
        
        this.img = new Image();
        this.img.src = "mobil2.png";

        this.mask = document.createElement("canvas");
        this.mask.width = width;
        this.mask.height = height;
        
        const maskCtx = this.mask.getContext("2d");
        this.img.onload = () =>{
            maskCtx.fillStyle = color;
            maskCtx.rect(0, 0, this.width, this.height);
            maskCtx.fill();

            maskCtx.globalCompositeOperation ="destination-atop";
            maskCtx.drawImage(this.img, 0, 0, this.width, this.height);
        };
    }   

    update(roadBorders, traffic){
        if(!this.damaged){
            this.xr = this.yv / dScale;
            this.yr = this.yv / dScale;
            // console.log(`ar: ${this.ar}; av: ${this.av}; vr: ${this.vr}; xv: ${this.xv}; yv: ${this.yv}`)
            this.#move();
            
            this.polygon = this.#createPolygon();
            this.damaged = this.#assessDamage(roadBorders, traffic);
            if(this.controlType != 'DUMMY'){
                this.sensor.update(roadBorders, traffic);
                if(this.controlType == "AI"){
                    const offsets = this.sensor.readings.map(
                        s=>s==null ? 0 : 1 - s.offset
                    );
                    // this.maxSpeed = 10;
                    const Arr = [[bestCar.y, this.yv], ...offsets.map(offset => [3.6, 6 * offset])];
                    const sumError = Arr.reduce((acc, [value1, value2]) => acc + relu((value2 - value1)), 0);
                    const outputsNN = NeuralNetwork.feedForward(offsets, this.brain);
                    this.fitness = iae(sumError);
                    this.controls.forward = outputsNN[0];
                    this.controls.left = outputsNN[1];
                    this.controls.right = outputsNN[2];
                    this.controls.reverse = outputsNN[3];
                // Program akan ke sini terlebih dulu untuk menerima input dari sensor dan menyerahkan ke model acc
                }else if(this.controlType == "ACC"){
                    // this.leadYR berfungsi seperti berikut
                    // 1. index pertama dari leadYV akan dimasukki nilai dari index ke dua
                    // 2. Nilai index ke dua akan berubah tergantung objek yang dibaca oleh sensor. Undefined jika tidak ada
                    // 3. Repeat
                    this.leadYR[0] = this.leadYR[1];  // Langkah 1

                    // Langkah 2
                    if(this.sensor.readings[0]){
                        this.leadYR[1] = this.sensor.readings[0].y / dScale;
                    }else{
                        this.leadYR[1] = undefined;
                    }

                    // leadVV digunakan untuk menentukan kecepatan dari mobil lead
                    // Perhitungan leadVV di sini yaitu
                    // 1. Apakah frame sekarang atau sebelumnya TIDAK ada mobil di depan? (Karena menggunakan pernyataan '== undefined')
                    // 2. Kalau tidak ada mobil di depan maka nilai leadVV akan menjadi undefined
                    // 3. Kalau ada mobil di depan maka nilainya akan menjadi |this.leadYR[1] - this.leadYR[0]| (nilai absolut dari selisih posisi mobil lead dari frame sekarang dan sebelumnya)
                    
                    // const leadYR = traffic[0].yr;
                    // const leadVV = traffic[0].vr;
                    const leadVV = ((this.leadYR[0] == undefined) || (this.leadYR[1] == undefined)) ? undefined : Math.abs(this.leadYR[1] - this.leadYR[0]) * tScale;
                    const controlKeys = [this.controls.forward, this.controls.reverse, this.controls.left, this.controls.right]; // Ini dipakai untuk menentukan kalau user sedang tidak memegang setir
                    const allFalse = controlKeys.every(key => !key);
                    // Bagian bawah ini sudah mulai bermasalah. Tolong kalau ada yang salah langsung lapor aja walau udah aku kasih komentar
                    if (allFalse){ // Kalau User ngga megang setir berarti ACC ambil alih
                        const Ddef = 20; // Ini seharusnya 25 meter sebagai jarak default (Karena perubahan ke pixel)
                        const Tg = 1.2; // Ini seharusnya 1.2 sekon (Karena perubahan ke fps)
                        this.safeDistance = Ddef + (Tg * this.vr); // Di sini untuk menentukan jarak amannya. Emang jarak aman itu variabel terikat
                        this.brain.accUpdate(this.vr, leadVV, desiredVV, this.yr, this.leadYR[1], this.safeDistance) // Di sini letak dimana ACC memberi kendalinya
                        this.fitness = this.brain.fitness; // Untuk perhitungan fitness, bagian ini aman
                    }
                }
            }
        }
    }
    // Fungsi ini aman
    #assessDamage(roadBorders, traffic){
        for(let i = 0; i < roadBorders.length; i++){
            if(polysIntersect(this.polygon, roadBorders[i])){
                return true;
            }
        }
        for(let i = 0; i < traffic.length; i++){
            if(polysIntersect(this.polygon, traffic[i].polygon)){
                return true;
            }
        }
        return false;
    }
    // Fungsi ini aman
    #createPolygon(){
        const points = [];
        const rad = Math.hypot(this.width, this.height) / 2;
        const alpha = Math.atan2(this.width, this.height);
        points.push({
            x: this.xv - Math.sin(this.angle - alpha) * rad,
            y: this.yv - Math.cos(this.angle - alpha) * rad
        });
        points.push({
            x: this.xv - Math.sin(this.angle + alpha) * rad,
            y: this.yv - Math.cos(this.angle + alpha) * rad
        });
        points.push({
            x: this.xv - Math.sin(Math.PI + this.angle - alpha) * rad,
            y: this.yv - Math.cos(Math.PI + this.angle - alpha) * rad
        });
        points.push({
            x: this.xv - Math.sin(Math.PI + this.angle + alpha) * rad,
            y: this.yv - Math.cos(Math.PI + this.angle + alpha) * rad
        });
        return points;
    }
    // Fungsi ini bermasalah
    #move(){
        // 2 bagian ini mungkin ngga perlu dulu diubah karena ini untuk kontrol manual
        if(this.controls.forward){
            // this.vv += this.av;
            this.vr += 0.2 / tScale * dScale;
        }
        if(this.controls.reverse){
            // this.vv -= this.av;
            this.vr += 0.2 / tScale * dScale;
        }

        // BAGIAN INI YANG KRUSIAL CUY
        if(this.controlType == 'ACC'){
            this.ar = this.brain.pid
            this.av = this.ar / tScale;
            this.vr += this.av;
        // INI JUGA
        }else if(this.controlType == 'DUMMY'){
            this.theta = (this.theta % 360) + 1;
            this.ar = sinAngle(this.theta);
            // this.ar = 1;
            this.av = this.ar / tScale;
            this.vr += this.av;
        }

        // Untuk ini seharusnya problemnya mengikuti kecepatan
        if(this.vr != 0){
            const flip = (this.vr > 0) ? 1 : -1;
            if(this.controls.left){
                this.angle += 0.03 * flip;
            }
            if(this.controls.right){
                this.angle -= 0.03 * flip;
            }
        }

        // Ini untuk pembatas kecepatan
        if(this.vr > maxVelocity){
            this.vr = maxVelocity;
        }
        if(this.vr < minVelocity){
            this.vr = minVelocity;
        }
        // Ini harusnya yang bermasalah, this.fv seharusnya -0.05 m/s^-2 
        // jadi akan selalu berlawanan arah dengan arah gerak 
        if(this.vr > 0){
            this.vr -= this.fr / tScale
        }
        if(this.vr < 0){
            this.vr += this.fr / tScale
        }
        this.ar -= this.fr
        if(Math.abs(this.vr) < this.fr / tScale){
            this.vr = 0;
        }

        if(this.controlType == "DUMMY"){
            console.log(`t = ${time}; ar = ${this.ar}`)
        }

        // Ini juga
        this.xv -= Math.sin(this.angle) * (this.vr / tScale * dScale);
        this.yv -= Math.cos(this.angle) * (this.vr / tScale * dScale);
    }

    draw(ctx, drawSensor=false){
        // The commented code below is used for the event handling when the car is damaged or not 
        // and also to draw from one point to another. While this is proven to be more
        // accurate, it still have major issues for the recent code. Leave it as is if not 
        // yet necessary
        // if(this.damaged){
        //     ctx.fillStyle = "gray";
        // }else{
        //     ctx.fillStyle = color;
        // }
        // ctx.beginPath();
        // ctx.moveTo(this.polygon[0].x,this.polygon[0].y);
        // for(let i = 1; i < this.polygon.length; i++){
        //     ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
        // }
        // ctx.fill();

        // These are the event handler for the damaged car if it doesn't get damaged
        if(this.sensor && drawSensor && !this.damaged){
            this.sensor.draw(ctx);
        }

        // These will daw the car according to its location, rotation and also size
        ctx.save();
        ctx.translate(this.xv, this.yv);
        ctx.rotate(-this.angle);
        if(!this.damaged){
            ctx.drawImage(
                this.mask,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
                );
            ctx.globalCompositeOperation = "multiply";
        }
        ctx.drawImage(
                this.img,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
                );
        ctx.restore();
    }
}