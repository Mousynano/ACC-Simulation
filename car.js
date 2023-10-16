class Car{
    constructor(x, y, width, height, controlType, maxSpeed=10, color="blue"){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.speed = 0;
        this.acceleration = 0.2;
        this.maxSpeed = maxSpeed;
        this.friction = 0.05;
        this.angle = 0;
        this.damaged = false;

        this.useBrain = controlType == "AI";

        if(controlType != "DUMMY"){
            this.sensor = new Sensor(this);
            this.brain = new NeuralNetwork(
                [this.sensor.rayCount, 1]
            );
        }
        this.drel = 0;
        this.safeDistance = 0;
        this.desiredSpeed = 0;

        this.Kp = 1;
        this.Ki = 0.2;
        this.Kd = 0.1;
        this.errorADC = [0];
        this.errorAVC = [0];

        this.controls = new Controls(controlType);
        
        this.img = new Image();
        this.img.src = "mobil2.png"

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
        }
    }   

    update(roadBorders, traffic){
        if(!this.damaged){
            this.#move();
            this.polygon = this.#createPolygon();
            this.damaged = this.#assessDamage(roadBorders, traffic);
        }
        if(this.sensor){
            this.sensor.update(roadBorders, traffic);
            const offsets = this.sensor.readings.map(
                s=>s==null ? 0 : 1 - s.offset
            );
            const maxSensorLen = 0.82;
            this.safeDistance = this.sensor.rayLength * maxSensorLen; //penting !!
            this.desiredSpeed = 8;
            
            if (this.sensor.readings[0] !== null) {
                this.drel = Math.abs(this.sensor.readings[0].y - this.sensor.car.y);

            }else{
                this.drel = Infinity;
            }
            // }


            const outputs = NeuralNetwork.feedForward(offsets, this.brain);

            // if(this.useBrain) {
            //     this.controls.adc = outputs[0];
            //     this.controls.adc == 1? this.controls.avc = 0 : this.controls.avc = 1;
            // }
            // console.log(outputs);
            if(this.useBrain){
                this.controls.adc = this.safeDistance > this.drel;
                this.controls.avc = !this.controls.adc;
            }
        }
    }

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

    #createPolygon(){
        const points = [];
        const rad = Math.hypot(this.width, this.height) / 2;
        const alpha = Math.atan2(this.width, this.height);
        points.push({
            x: this.x - Math.sin(this.angle - alpha) * rad,
            y: this.y - Math.cos(this.angle - alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(this.angle + alpha) * rad,
            y: this.y - Math.cos(this.angle + alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad
        });
        return points;
    }

    #move(){
        if (this.controls.avc) {
            this.indexADC = 0;
            this.indexAVC += 1;
            this.errorAVC[this.indexAVC] = this.desiredSpeed - this.speed;
            let sumError = this.errorAVC.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        
            // Hitung P, I, dan D
            let P = this.Kp * this.errorAVC[this.indexAVC];
            let I = this.Ki * sumError;
            let D = this.Kd * (this.errorAVC[this.indexAVC] - this.errorAVC[this.indexAVC - 1]);
        
            // Atur kecepatan berdasarkan PID
            this.speed += (P + I + D);
            console.log("avc speed : " + this.speed);
            // this.speed += this.acceleration;
        }
        else if (this.controls.adc) {
            this.indexAVC = 0;
            this.indexADC += 1;
            this.errorADC[this.indexADC] = (this.safeDistance - this.drel) / (150 * 0.82); // Hitung error jarak
            let sumError = this.errorADC.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        
            // Hitung P, I, dan D
            let P = this.Kp * this.errorADC[this.indexADC];
            let I = this.Ki * sumError;
            let D = this.Kd * (this.errorADC[this.indexADC] - this.errorADC[this.indexADC - 1]);
        
            // Atur kecepatan berdasarkan PID
            this.speed += (P + I + D);
            console.log("adc speed : " + this.speed);
        }
        if(this.controls.forward){
            this.speed += this.acceleration;
        }
        if(this.controls.reverse){
            this.speed -= this.acceleration;
        }

        if(this.speed > this.maxSpeed){
            this.speed = this.maxSpeed;
        }
        if(this.speed < -this.maxSpeed/2){
            this.speed = -this.maxSpeed/2;
        }

        if(this.speed > 0){
            this.speed -= this.friction;
        }
        if(this.speed < 0){
            this.speed += this.friction;
        }
        if(Math.abs(this.speed) < this.friction){
            this.speed = 0;
        }

        if(this.speed != 0){
            const flip = (this.speed > 0) ? 1 : -1;
            if(this.controls.left){
                this.angle += 0.03 * flip;
            }
            if(this.controls.right){
                this.angle -= 0.03 * flip;
            }
        }

        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
    }

    draw(ctx, drawSensor=false){
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
        if(this.sensor && drawSensor){
            this.sensor.draw(ctx);
        }   
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);
        if(!this.damaged){
            ctx.drawImage(
                this.mask,
                -this.width/2,
                -this.height/2,
                this.width,
                this.height
                );
            ctx.globalCompositeOperation = "multiply";
        }
        ctx.drawImage(
                this.img,
                -this.width/2,
                -this.height/2,
                this.width,
                this.height
                );
        ctx.restore();
    }
}