$(function () {
  /* ChartJS
   * -------
   * Data and config for chartjs
   */
  'use strict';
  var data = {
    labels: ["2013", "2014", "2014", "2015", "2016", "2017"],
    datasets: [{
      label: '# of Votes',
      data: [10, 19, 3, 5, 2, 3],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)'
      ],
      borderColor: [
        'rgba(255,99,132,1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ],
      borderWidth: 1,
      fill: false
    }]
  };

  var areaData = {
    labels: ["2013", "2014", "2015", "2016", "2017"],
    datasets: [{
      label: '# of Votes',
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)'
      ],
      borderColor: [
        'rgba(255,99,132,1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ],
      borderWidth: 1,
      fill: true, // 3: no fill
    }]
  };

  var options = {
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true
        }
      }]
    },
    legend: {
      display: false
    },
    elements: {
      point: {
        radius: 0
      }
    }

  };

  var areaOptions = {
    plugins: {
      filler: {
        propagate: true
      }
    }
  }


  // Get context with jQuery - using jQuery's .get() method.
  if ($("#barChart").length) {
    var barChartCanvas = $("#barChart").get(0).getContext("2d");
    // This will get the first returned node in the jQuery collection.
    var barChart = new Chart(barChartCanvas, {
      type: 'bar',
      data: data,
      options: options
    });
  }

  if ($("#lineChart").length) {
    var lineChartCanvas = $("#lineChart").get(0).getContext("2d");
    var lineChart = new Chart(lineChartCanvas, {
      type: 'line',
      data: data,
      options: options
    });
  }

  if ($("#areaChart").length) {
    var areaChartCanvas = $("#areaChart").get(0).getContext("2d");
    var areaChart = new Chart(areaChartCanvas, {
      type: 'line',
      data: areaData,
      options: areaOptions
    });
  };
});

(async function () {
  try {

    // --- orders per year chart config -----
    try {
      const resp = await fetch('/api/reports?orders-year-count=2022', { method: 'GET' });
      const dataFromServer = await resp.json();

      let xValues = ['Jan', 'Feb', 'Mar', 'Apr', 'May', "Jun", 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      let yValues = [];

      for (let i = 0; i < 12; i++) {
        let output = '';
        for (let j = 0; j < 12; j++) {
          if (dataFromServer['orders-year-count'][j]) {
            if (dataFromServer['orders-year-count'][j].month == (i + 1)) {
              output = dataFromServer['orders-year-count'][j].length;
              break;
            } else {
              output = 0;
            };
          };
        };
        yValues.push(output);
      };

      new Chart("ordersChart", {
        type: "bar",
        data: {
          labels: xValues,
          datasets: [{
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
              'rgba(255,99,132,1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(255,99,132,1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            fill: true,
            borderWidth: 2,
            data: yValues
          }]
        },
        options: {
          legend: { display: false },
          scales: {
            yAxes: [{ ticks: { min: 0, max: 16 } }],
          },
          plugins: {
            filler: {
              propagate: true
            }
          }
        }
      });

    } catch (err) {
      console.error('First chart err => ', err);
    };


    // ------ request count chart config ------
    try {
      const resp = await fetch('/api/reports?requests-today=0', { method: 'GET' });
      const dataFromServer = await resp.json();

      let xValues = [];
      let yValues = [];

      for (let i = 0; i <= 23; i++) {
        if (i >= 12) xValues.push(i == 12 ? 12 + " pm" : i - 12 + " pm");
        else xValues.push(i + " am");
      };

      for (let i = 0; i < 24; i++) {
        let output = '';
        for (let j = 0; j < 24; j++) {
          if (dataFromServer['requests-today'][j]) {
            if (dataFromServer['requests-today'][j].hour == i) {
              output = Number(dataFromServer['requests-today'][j].count);
              break;
            } else {
              output = 0;
            };
          };
        };
        yValues.push(output);
      };

      new Chart("requestsChart", {
        type: "bar",
        data: {
          labels: xValues,
          datasets: [{
            lineTension: 0,
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)',
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
              'rgba(255,99,132,1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(255,99,132,1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            fill: true,
            borderWidth: 1,
            data: yValues
          }]
        },
        options: {
          legend: { display: false },
          scales: {
            yAxes: [{ ticks: { min: 0 } }],
          },
          plugins: {
            filler: {
              propagate: true
            }
          }
        }
      });
    } catch (err) {
      console.log('Request chart err', err);
    };

  } catch (error) {
    console.error(error);
  };
}());