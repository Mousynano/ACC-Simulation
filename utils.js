function lerp(A, B, t){
    return A + (B - A) * t;
}

function getIntersection(A, B, C, D){ 
    const tTop = (D.x - C.x) * (A.y - C.y) - (D.y-C.y) * (A.x-C.x);
    const uTop = (C.y - A.y) * (A.x - B.x) - (C.x-A.x) * (A.y-B.y);
    const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);
    
    if(bottom != 0){
        const t = tTop / bottom;
        const u = uTop / bottom;
        if(t >= 0 && t <= 1 && u >= 0 && u <= 1){
            return {
                x: lerp(A.x, B.x, t),
                y: lerp(A.y, B.y, t),
                offset: t
            }
        }
    }

 return null;
}

function polysIntersect(poly1, poly2){
    for(let i = 0; i < poly1.length; i++){
        for(let j = 0; j < poly2.length; j++){
            const touch = getIntersection(
                poly1[i],
                poly1[(i + 1) % poly1.length],
                poly2[j],
                poly2[(j + 1) % poly2.length]
            );
            if(touch){
                return true;
            }
        }
    }
    return false;
}

function getRGBA(value){
    const alpha = Math.abs(value);
    const R = value < 0? 0 :255;
    const G = R;
    const B = value > 0? 0 : 255;
    return "rgba("+R+", "+G+", "+B+", "+alpha+")";
}

function getRandomColor(){
    const hue = 290 + Math.random() * 260;
    return "hsl("+hue+", 100%, 60%)";
}

function relu(x){
    return Math.max(0, x);
}

function iae(sumError){
    const ff = Math.abs(sumError);
    return ff;
}

function ise(sumError){
    const ff = sumError * sumError;
    return ff;
}

function itae(sumError, t){
    const ff = Math.abs(sumError);
    return ff * t;
}

function itse(sumError, t){
    const ff = sumError * sumError;
    return ff * t;
}

function quickSortWithIndices(arr, low = 0, high = arr.length - 1) {
    if (low < high) {
        const pi = partition(arr, low, high);

        quickSortWithIndices(arr, low, pi - 1);
        quickSortWithIndices(arr, pi + 1, high);
    }
}

function partition(arr, low, high) {
    const pivot = arr[high][0];
    let i = low - 1;

    for (let j = low; j < high; j++) {
        if (arr[j][0] <= pivot) {
            i++;

            // Swap arr[i] dan arr[j]
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }

    // Swap arr[i + 1] dan arr[high]
    const temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;

    return i + 1;
}

// dari main.js
