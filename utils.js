function lerp(A, B, x){
    return A + (B - A) * x;
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

function iae(error){
    const ff = Math.abs(error);
    return ff;
}

function ise(error){
    const ff = error * error;
    return ff;
}

function itae(error, t){
    const ff = Math.abs(error);
    return ff * t;
}

function itse(error, t){
    const ff = error * error;
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

function splitArr(text){
    let arr = text.split(',');
    return arr.map(e => parseFloat(e));
}

function sinAngle(x) {
    var radian = x * (Math.PI / 180);
    var result = Math.sin(radian);
    return result;
}

function calculateStandardDeviation(data) {
    // Hitung rata-rata
    const mean = data.reduce((acc, val) => acc + val, 0) / data.length;
  
    // Hitung selisih kuadrat dari setiap nilai dengan rata-rata
    const squaredDifferences = data.map(val => Math.pow(val - mean, 2));
  
    // Hitung rata-rata dari selisih kuadrat
    const meanSquaredDifferences = squaredDifferences.reduce((acc, val) => acc + val, 0) / squaredDifferences.length;
  
    // Hitung akar kuadrat dari rata-rata selisih kuadrat
    const standardDeviation = Math.sqrt(meanSquaredDifferences);
  
    return standardDeviation;
}

function calculateAverage(numbers) {
    const validNumbers = numbers.filter(number => typeof number === 'number' && !isNaN(number) && number !== null);
    
    if (validNumbers.length === 0) return 0;
    
    const sum = validNumbers.reduce((accumulator, currentValue) => accumulator + currentValue);
    return sum / validNumbers.length;
}


// dari main.js
