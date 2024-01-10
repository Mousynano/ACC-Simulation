document.addEventListener('DOMContentLoaded', function () {
    const veloCtx = document.getElementById('Kecepatan').getContext('2d');
    const accelerationCtx = document.getElementById('Percepatan').getContext('2d');
    const distanceCtx = document.getElementById('JarakRelatif').getContext('2d');
    const fitnessCtx = document.getElementById('Fitness').getContext('2d');
    
    charts[0] = createChart(veloCtx, 'KecepatanEgo');
    charts[1] = createChart(accelerationCtx, 'PercepatanEgo');
    charts[2] = createChart(distanceCtx, 'JarakRelatif');
    charts[3] = createChart(fitnessCtx, 'Fitness', false);

    window.modifyData = function (time, speedEgo, accelerationEgo, accelerationLead, distance, fitness) {
        addData(charts[0], time, speedEgo);
        addData(charts[1], time, accelerationEgo);
        addData(charts[2], time, distance);
        addData(charts[3], time, fitness);

        removeOldData(charts, time);
    };

    animate();
});

function createChart(ctx, label) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: label,
                data: [],
                borderColor: 'blue',
                fill: false,
                pointRadius: 0,
            }],
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

// Fungsi removeOldData diperbarui untuk mempertimbangkan chart mana yang perlu dihapus
function removeOldData(charts, time) {
    const delayToRemove = 5; // Penundaan waktu sebelum mulai menghapus data (5 detik)

    if (time > delayToRemove) {
        const currentTime = time - delayToRemove;

        charts.forEach((chart, index) => {
            if (index !== 3) { // Hanya chart ke-3 yang tidak dihapus
                while (chart.data.labels.length > 0 && chart.data.labels[0] <= currentTime) {
                    chart.data.labels.shift();
                    chart.data.datasets[0].data.shift();
                }
                chart.update();
            }
        });
    }
}

function addData(chart, time, value) {
    chart.data.labels.push(time);
    chart.data.datasets[0].data.push(value);
    chart.update();
}