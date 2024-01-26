
// This class is to define the car model
class Car{
    // It will require thex and y where it will be spawned, the length dimension for the size,
    // the control used by the model, the max velocity and the color
    constructor(x, y, width, height, controlType, maxSpeed=maxVelocity, color=getRandomColor()){

        // this.egoCarAcceleration = 0;
        // this.egoCarVelocity = [];
        this.leadCarAcceleration = 0;
        this.leadCarVelocity = [undefined, undefined];
        this.leadCarPos = [undefined, undefined];
        this.relativeDistance = 0;
        // this.egoCarVelocity = [undefined, undefined];

        this.fitness = 10000;

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.theta = 0;
        this.distance = null;

        this.speed = 25;
        this.acceleration = 0.2;
        this.maxSpeed = maxSpeed;
        this.friction = 0.05;
        this.angle = 0;
        this.damaged = false;

        this.controlType = controlType;
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
                    const Arr = [[bestCar.y, this.y], ...offsets.map(offset => [3.6, 6 * offset])];
                    const sumError = Arr.reduce((acc, [value1, value2]) => acc + relu((value2 - value1)), 0);
                    const outputsNN = NeuralNetwork.feedForward(offsets, this.brain);
                    this.fitness = iae(sumError);
                    this.controls.forward = outputsNN[0];
                    this.controls.left = outputsNN[1];
                    this.controls.right = outputsNN[2];
                    this.controls.reverse = outputsNN[3];
                }else if(this.controlType == "ACC"){
                    this.leadCarPos[0] = this.leadCarPos[1];
                    if(this.sensor.readings[0]){
                        this.leadCarPos[1] = this.sensor.readings[0].y;
                    }else{
                        this.leadCarPos[1] = undefined;
                    }
                    this.leadCarVelocity[0] = this.leadCarVelocity[1];
                    const Vlead = ((this.leadCarPos[0] == undefined) || (this.leadCarPos[1] == undefined)) ? undefined : Math.abs(this.leadCarPos[1] - this.leadCarPos[0]);
                    this.leadCarVelocity[1] = Vlead;
                    const Alead = ((this.leadCarVelocity[0] == undefined )|| (this.leadCarVelocity[1] == undefined)) ? undefined : (this.leadCarVelocity[1] - this.leadCarVelocity[0]);
                    this.leadCarAcceleration = Alead;

                    const controlKeys = [this.controls.forward, this.controls.reverse, this.controls.left, this.controls.right];
                    const allFalse = controlKeys.every(key => !key);
                    if (allFalse){
                        const Ddef = 250;
                        const Tg = 1/25;
                        this.safeDistance = Ddef + (Tg * this.speed);
                        this.brain.accUpdate(this.speed, Vlead, desiredSpeed, this.y, this.leadCarPos[1], this.safeDistance)
                        this.acceleration = this.brain.pid;
                        this.fitness = this.brain.fitness;
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

        if(this.controlType == 'ACC'){
            this.speed += this.acceleration;
            this.Aego = (this.acceleration - this.friction)
            this.Vego = this.speed;
            this.Xego = this.y * dScale
        }else if(this.controlType == 'DUMMY'){
            this.speed = 24;
            this.theta = (this.theta % 360) + 3;
            this.acceleration = (sinAngle(this.theta)) * 2.5;
            this.speed += this.acceleration;
            this.Alead = (this.acceleration - this.friction)
            this.Vlead = this.speed;
            this.Xlead = this.y * dScale;
        }

        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
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
        ctx.translate(this.x, this.y);
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