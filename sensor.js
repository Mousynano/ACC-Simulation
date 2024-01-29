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

class Sensor{
    constructor(car, rayCount){
        this.car = car;
        this.rayCount = rayCount;
        this.rayLength = 750;
        this.raySpread = Math.PI / 4;

        this.rays = [];
        this.readings = [];
    }

    update(roadBorders, traffic){
        this.#castRays();
        this.readings = [];
        for(let i = 0; i < this.rays.length; i++){
            this.readings.push(
                this.#getReading(this.rays[i], roadBorders, traffic)
            );
        }
    }

    #getReading(ray,roadBorders, traffic) {
        let touches = [];

        for(let i = 0; i < roadBorders.length; i++){
            const touch=getIntersection(
                ray[0],
                ray[1],
                roadBorders[i][0],
                roadBorders[i][1]
            );
            if(touch){
                touches.push(touch);
            }
        }

        for(let i = 0; i < traffic.length; i++){
            const poly = traffic[i].polygon;
            for (let j = 0; j < poly.length; j++){
                const value = getIntersection(
                    ray[0],
                    ray[1],
                    poly[j],
                    poly[(j+1)%poly.length]
                );
                if(value){
                    touches.push(value);
                }
            }
        }

        if(touches.length == 0){
            return null;
        }else{
            const offsets = touches.map(e=>e.offset);
            const minOffset = Math.min(...offsets);
            return touches.find(e=>e.offset == minOffset);
        }
    }

    #castRays(){
        this.rays = [];
        for(let i = 0; i < this.rayCount; i++){
            const rayAngle = lerp(
                this.raySpread / 2,
                -this.raySpread / 2,
                this.rayCount == 1 ? 0.5 : i / (this.rayCount - 1)
            ) + this.car.angle;

            const start = {x: this.car.xv, y: this.car.yv};
            const end = {
                x: this.car.xv -
                    Math.sin(rayAngle) * this.rayLength,
                y: this.car.yv -
                    Math.cos(rayAngle) * this.rayLength
            };
            this.rays.push([start, end]);
        }
    }

    draw(ctx){
        for(let i = 0; i < this.rayCount; i++){
            let end = this.rays[i][1];
            if(this.readings[i]){
                end = this.readings[i];
            }

            // This is for the untouched sensor signal length
            ctx.beginPath();
            ctx.lineWidth = 10;
            ctx.strokeStyle = "yellow";
            ctx.moveTo(
                this.rays[i][0].x,
                this.rays[i][0].y
            );
            ctx.lineTo(
                end.x,
                end.y
            );
            ctx.stroke();

            // This is for the touched sensor signal length
            ctx.beginPath();
            ctx.lineWidth = 10;
            ctx.strokeStyle = "white";
            ctx.moveTo(
                this.rays[i][1].x,
                this.rays[i][1].y
            );
            ctx.lineTo(
                end.x,
                end.y
            );
            ctx.stroke();
        }
    }        
}