class Car{
    constructor(x, y, width, height, controlType, maxSpeed=maxVelocity, color=getRandomColor()){
        this.egoCarAcceleration = 0;
        this.egoCarVelocity = [];
        this.leadCarAcceleration = 0;
        this.leadCarVelocity = [0, 0];
        this.leadCarPos = [];
        this.relativeDistance = 0;

        this.fitness = 100000;

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

        this.controlType = controlType;
        // Brain.insert(this, data, mode);

        this.delaySpeedSensor = 0;
        this.coba = [];
        this.controls = new Controls(controlType);
        
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
            this.#move();
            this.polygon = this.#createPolygon();
            this.damaged = this.#assessDamage(roadBorders, traffic);
            if(this.sensor){
                this.distance = 175;
                let leadCarNow = 175;
                this.sensor.update(roadBorders, traffic);
                const offsets = this.sensor.readings.map(
                    s=>s==null ? 0 : 1 - s.offset
                );

                if ((this.sensor.readings[0]) && (this.sensor.rayCount == 1)) {
                    leadCarNow = this.sensor.readings[0].y;
                    if(this.leadCarPos.length > 0){
                        this.leadCarPos[0] = this.leadCarPos[1];
                        this.leadCarPos[1] = this.sensor.readings[0].y;
                    }else{
                        this.leadCarPos[1] = this.sensor.readings[0].y;
                    }
                    this.distance = Math.abs(this.sensor.readings[0].y - this.sensor.car.y) - 25;
                }else{
                    this.distance = 175;
                    leadCarNow = 175;
                }
    
                if (this.sensor.rayCount == 0){}
                else if(this.controlType == "AI"){
                    this.maxSpeed = 10;

                    const Arr = [[bestCar.y, this.y], ...offsets.map(offset => [3.6, 6 * offset])];
                    const sumError = Arr.reduce((acc, [value1, value2]) => acc + relu((value2 - value1)), 0);
                    const outputsNN = NeuralNetwork.feedForward(offsets, this.brain);
                    this.fitness = iae(sumError);
                    this.controls.forward = outputsNN[0];
                    this.controls.left = outputsNN[1];
                    this.controls.right = outputsNN[2];
                    this.controls.reverse = outputsNN[3];
                }else if(this.controlType == "ACC"){
                    const controlKeys = [this.controls.forward, this.controls.reverse, this.controls.left, this.controls.right];
                    const allFalse = controlKeys.every(key => !key);
                    if (allFalse){
                        let [outputsACC, fitness] = AdaptiveCruiseControl.accUpdate(this.speed, this.distance, safeDistance, leadCarNow, desiredSpeed, this.brain);
                        this.fitness = fitness;
                        this.speed += outputsACC;
                    }
                }
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

        // console.log("speed now: " + this.speed);
        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;

        this.speedOutput = this.speed;
        if (this.egoCarVelocity.length != 0){
            this.egoCarVelocity[0] = this.egoCarVelocity[1];
            this.egoCarVelocity[1] = this.speedOutput;
            this.accelerationOutput = this.egoCarVelocity[1] - this.egoCarVelocity[0];
            // console.log("acceleration output: " + this.accelerationOutput)
        }else{
            this.egoCarVelocity[1] = this.speedOutput;
        }
        
        // if(this.leadCarPos.length != 0){
        //     this.leadCarVelocity[0] = this.leadCarVelocity[1];
        //     this.leadCarVelocity[1] = this.leadCarPos[1] - this.leadCarPos[0];
        //     this.leadCarAcceleration = this.leadCarVelocity[1] - this.leadCarVelocity[0];
        // }else{
        //     this.leadCarVelocity[1] = this.leadCarPos[1] - this.leadCarPos[0];
        //     // console.log("leadCarVelocity: " + this.leadCarVelocity);
        //     if (!this.leadCarVelocity[1]){
        //         this.leadCarVelocity[1] = 0;
        //     }
        // }
        this.relativeDistance = this.distance;
        this.fitness = this.damaged ? 0 : this.fitness;
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
        if(this.sensor && drawSensor && !this.damaged){
            // this.car.color = "blue";
            this.sensor.draw(ctx);
        }
        // else{
            // this.car.color = "grey";
        // }
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