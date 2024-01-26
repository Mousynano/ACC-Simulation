
// This code is used to handle the chart being displayed on screen
document.addEventListener('DOMContentLoaded', function () {
    // Define each context for the chart to be put on
    const veloCtx = document.getElementById('Kecepatan').getContext('2d');
    const accelerationCtx = document.getElementById('Percepatan').getContext('2d');
    const distanceCtx = document.getElementById('Jarak Relatif').getContext('2d');
    const fitnessHistoryCtx = document.getElementById('Fitness History').getContext('2d');
    // const fitnessCtx = document.getElementById('Fitness').getContext('2d');
    
    // from main.js, it will update the array for the chart
    charts[0] = createChart(veloCtx, ['Kecepatan Ego (m/s)', 'Kecepatan Lead (m/s)']);
    charts[1] = createChart(accelerationCtx, ['Percepatan Ego (m/s^-2)', 'Percepatan Lead (m/s^-2)']);
    charts[2] = createChart(distanceCtx, ['Jarak Relatif (m)', 'Jarak Aman (m)']);
    charts[3] = createChart(fitnessHistoryCtx, ['Fitness History']);
    // charts[4] = createChart(fitnessCtx, ['Fitness']);

    // This is used to handle the data from each frame.
    window.modifyData = function (time, speedEgo, accelerationEgo, speedLead, accelerationLead, distance, safeDistance, fitnessHistoryDisplayed, generationArr, fitnessArr) {
        // console.log(`safeDistance: ${safeDistance}`)
        addData(charts[0], time, speedEgo, speedLead);
        addData(charts[1], time, accelerationEgo, accelerationLead);
        addData(charts[2], time, distance, safeDistance);
        if(!fitnessHistoryDisplayed){
            addFitnessHistory(charts[3], generationArr, fitnessArr);
        }
        // addData(charts[4], time, fitness);

        // This was used to remove the old data to avoid lag. Use this if you 
        // don't need to see the data from the forst second of each generation
        // removeOldData(charts, time); 
    };

    // This will start the program
    animate();
});

// This is used to create the chart
function createChart(ctx, datasetLabels) {
    const datasets = datasetLabels.map((label, index) => {
        return {
            label: label,
            data: [],
            borderColor: index === 0 ? 'blue' : 'red', // Atur warna sesuai kebutuhan
            fill: false,
            pointRadius: 0,
        };
    });

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: datasets,
        },
        options: {
            animation: {
                duration: 0
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                },
            },
        },
    });
}

// This is used to add a new data to the chart
function addData(chart, time, value1, value2=undefined) {
    // console.log(`time: ${time}; value1: ${value1}; value2: ${value2}`)
    chart.data.labels.push(time);
    chart.data.datasets[0].data.push(value1);
    if (value2 != 'jarak'){
        value2 = (value2 == undefined) ? undefined : value2;
        chart.data.datasets[1].data.push(value2);
    }
    chart.update();
}

// Similar to addData, but this is exclusively for the fitnessHistory
function addFitnessHistory(chart, generationArr, fitnessArr){
    // console.log('generationArr: ' + generationArr);
    // console.log('fitnessArr: ' + fitnessArr);
    chart.data.labels = generationArr;
    chart.data.datasets[0].data = fitnessArr;
    chart.update();
}

// This is used to delete data from previous delayToRemove seconds
function removeOldData(charts, time) {
    const delayToRemove = 5; // Change this to whatever you want

    if (time > delayToRemove) {
        const currentTime = time - delayToRemove;

        charts.forEach((chart, index) => {
            if (index < 3) { // Hanya chart ke-3 yang tidak dihapus
                while (chart.data.labels.length > 0 && chart.data.labels[0] <= currentTime) {
                    chart.data.labels.shift();
                    if(chart.data.datasets.length == 2){
                        if(chart.data.datasets[1].data.length == chart.data.datasets[0].data.length){
                            chart.data.datasets[1].data.shift();
                        }
                    }
                    chart.data.datasets[0].data.shift();
                }
                chart.update();
            }
        });
    }
}