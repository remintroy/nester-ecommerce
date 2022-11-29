

(async function () {
  try {

    try {
      const resp = await fetch('/api/reports?order-all-year-count=2022', { method: 'GET' });
      const dataFromServer = await resp.json();

      const options = {
        legend: { display: false },
        scales: {
          yAxes: [{
            ticks: {
              min: 0,
              precision: 0,
              fontColor: "white",
            },
            gridLines: {
              color: "rgba(0, 0, 0, 0)",
            }
          }],
          xAxes: [{
            gridLines: {
              color: "rgba(0, 0, 0, 0)",
            }
          }],
        },
        plugins: {
          filler: {
            propagate: true
          }
        }
      }

      let xValues = ['', '', '', '', '', "", '', '', '', '', '', ''];
      let yValuesA = [];
      let yValuesB = [];
      let yValuesC = [];
      let yValuesD = [];

      for (let i = 0; i < 12; i++) {
        let outputA = '';
        let outputB = '';
        let outputC = '';
        let outputD = '';

        for (let j = 0; j < 12; j++) {
          if (dataFromServer['order-all-year-count'].OR[j]) {
            if (dataFromServer['order-all-year-count'].OR[j].month == (i + 1)) {
              outputA = dataFromServer['order-all-year-count'].OR[j].length;
              break;
            } else {
              outputA = 0;
            };
          };
        };

        for (let j = 0; j < 12; j++) {
          if (dataFromServer['order-all-year-count'].SH[j]) {
            if (dataFromServer['order-all-year-count'].SH[j].month == (i + 1)) {
              outputB = dataFromServer['order-all-year-count'].SH[j].length;
              break;
            } else {
              outputB = 0;
            };
          };
        };

        for (let j = 0; j < 12; j++) {
          if (dataFromServer['order-all-year-count'].OT[j]) {
            if (dataFromServer['order-all-year-count'].OT[j].month == (i + 1)) {
              outputC = dataFromServer['order-all-year-count'].OT[j].length;
              break;
            } else {
              outputC = 0;
            };
          };
        };

        for (let j = 0; j < 12; j++) {
          if (dataFromServer['order-all-year-count'].DD[j]) {
            if (dataFromServer['order-all-year-count'].DD[j].month == (i + 1)) {
              outputD = dataFromServer['order-all-year-count'].DD[j].length;
              break;
            } else {
              outputD = 0;
            };
          };
        };

        yValuesA.push(outputA);
        yValuesB.push(outputB);
        yValuesC.push(outputC);
        yValuesD.push(outputD);
      };

      

      new Chart("orderdChartPG", {
        type: "line",
        data: {
          labels: xValues,
          datasets: [{
            backgroundColor: 'rgba(255,99,132,1)',
            borderColor: 'white',
            fill: false,
            borderWidth: 2,
            data: yValuesA
          }]
        },
        options: options
      });

      new Chart("shippedChartPG", {
        type: "line",
        data: {
          labels: xValues,
          datasets: [{
            backgroundColor: 'rgba(255,99,132,1)',
            borderColor: 'white',
            fill: false,
            borderWidth: 2,
            data: yValuesB
          }]
        },
        options: options
      });

      new Chart("OTChartPG", {
        type: "line",
        data: {
          labels: xValues,
          datasets: [{
            backgroundColor: 'rgba(255,99,132,1)',
            borderColor: 'white',
            fill: false,
            borderWidth: 2,
            data: yValuesC
          }]
        },
        options: options
      });

      new Chart("DDChartPG", {
        type: "line",
        data: {
          labels: xValues,
          datasets: [{
            backgroundColor: 'rgba(255,99,132,1)',
            borderColor: 'white',
            fill: false,
            borderWidth: 2,
            data: yValuesD
          }]
        },
        options: options
      });
    } catch (error) {
      // ...
    };

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
        type: "line",
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
            yAxes: [{
              ticks: {
                min: 0,
                precision: 0
              }
            }],
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

    const dayColor = [
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
      'rgba(255, 159, 64, 0.2)',
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
    ];

    const dayBorderColor = [
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
    ];

    const dayxValues = [];
    for (let i = 0; i <= 23; i++) {
      if (i >= 12) dayxValues.push(i == 12 ? 12 + " pm" : i - 12 + " pm");
      else dayxValues.push(i + " am");
    };

    const dayOptions = {
      legend: { display: false },
      scales: {
        yAxes: [{
          ticks: {
            min: 0,
            precision: 0
          }
        }],
      },
      plugins: {
        filler: {
          propagate: true
        }
      }
    }

    // ------ request count chart config ------
    try {
      const resp = await fetch('/api/reports?requests-today=0', { method: 'GET' });
      const dataFromServer = await resp.json();

      let xValues = dayxValues;
      let yValues = [];

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
            backgroundColor: dayColor,
            borderColor: dayColor,
            fill: true,
            borderWidth: 1,
            data: yValues
          }]
        },
        options: dayOptions
      });
    } catch (err) {
      console.log('Request chart err', err);
    };

    try {

      const resp = await fetch('/api/reports?pages-today=0', { method: 'GET' });
      const dataFromServer = await resp.json();

      let xValues = dayxValues;
      let yValuesA = [];
      let yValuesB = [];
      let yValuesC = [];
      let yValuesD = [];
      let yValuesE = [];
      let yValuesF = [];
      let yValuesG = [];

      for (let i = 0; i < 24; i++) {
        let outputA = 0;
        let outputB = 0;
        let outputC = 0;
        let outputD = 0;
        let outputE = 0;
        let outputF = 0;
        let outputG = 0;

        // home
        for (let j = 0; j < 24; j++) {
          if (dataFromServer['pages-today']?.home[j]) {
            if (dataFromServer['pages-today']?.home[j].hour == i) {
              outputA = Number(dataFromServer['pages-today']?.home[j].count);
              break;
            } else {
              outputA = 0;
            };
          };
        };

        // shop
        for (let j = 0; j < 24; j++) {
          if (dataFromServer['pages-today']?.shop[j]) {
            if (dataFromServer['pages-today']?.shop[j].hour == i) {
              outputB = Number(dataFromServer['pages-today']?.shop[j].count);
              break;
            } else {
              outputB = 0;
            };
          };
        };

        // product
        for (let j = 0; j < 24; j++) {
          if (dataFromServer['pages-today']?.product[j]) {
            if (dataFromServer['pages-today']?.product[j].hour == i) {
              outputC = Number(dataFromServer['pages-today']?.product[j].count);
              break;
            } else {
              outputC = 0;
            };
          };
        };

        // cart
        for (let j = 0; j < 24; j++) {
          if (dataFromServer['pages-today']?.cart[j]) {
            if (dataFromServer['pages-today']?.cart[j].hour == i) {
              outputD = Number(dataFromServer['pages-today']?.cart[j].count);
              break;
            } else {
              outputD = 0;
            };
          };
        };

        // wishlist
        for (let j = 0; j < 24; j++) {
          if (dataFromServer['pages-today']?.wishlist[j]) {
            if (dataFromServer['pages-today']?.wishlist[j].hour == i) {
              outputE = Number(dataFromServer['pages-today']?.wishlist[j].count);
              break;
            } else {
              outputE = 0;
            };
          };
        };

        // dashboard
        for (let j = 0; j < 24; j++) {
          if (dataFromServer['pages-today']?.dashboard[j]) {
            if (dataFromServer['pages-today']?.dashboard[j].hour == i) {
              outputF = Number(dataFromServer['pages-today']?.dashboard[j].count);
              break;
            } else {
              outputF = 0;
            };
          };
        };

        // checkout
        for (let j = 0; j < 24; j++) {
          if (dataFromServer['pages-today']?.checkout[j]) {
            if (dataFromServer['pages-today']?.checkout[j].hour == i) {
              outputG = Number(dataFromServer['pages-today']?.checkout[j].count);
              break;
            } else {
              outputG = 0;
            };
          };
        };

        yValuesA.push(outputA);
        yValuesB.push(outputB);
        yValuesC.push(outputC);
        yValuesD.push(outputD);
        yValuesE.push(outputE);
        yValuesF.push(outputF);
        yValuesG.push(outputG);
      };

      new Chart("userEveryPageChart", {
        type: "line",
        data: {
          labels: xValues,
          datasets: [
            {
              label: 'home',
              lineTension: 0,
              borderColor: dayBorderColor[0],
              fill: false,
              borderWidth: 1,
              data: yValuesA,
            },
            {
              label: 'Shop',
              lineTension: 0,
              borderColor: dayBorderColor[1],
              fill: false,
              borderWidth: 1,
              data: yValuesB
            },
            {
              label: 'Product',
              lineTension: 0,
              borderColor: dayBorderColor[2],
              fill: false,
              borderWidth: 1,
              data: yValuesC
            },
            {
              label: 'Cart',
              lineTension: 0,
              borderColor: dayBorderColor[3],
              fill: false,
              borderWidth: 1,
              data: yValuesD
            },
            {
              label: 'Wishlist',
              lineTension: 0,
              borderColor: dayBorderColor[4],
              fill: false,
              borderWidth: 1,
              data: yValuesE
            },
            {
              label: 'Dashboard',
              lineTension: 0,
              borderColor: dayBorderColor[5],
              fill: false,
              borderWidth: 1,
              data: yValuesF
            },
            {
              label: 'Checkout',
              lineTension: 0,
              borderColor: dayBorderColor[5],
              fill: false,
              borderWidth: 1,
              data: yValuesG
            }
          ]
        },
        options: {
          legend: { display: true },
          scales: {
            yAxes: [{
              ticks: {
                min: 0,
                precision: 0
              }
            }],
          },
          plugins: {
            filler: {
              propagate: true
            }
          }
        }
      });

    } catch (error) {
      console.log('All pages chart err', error);
    };

  } catch (error) {
    console.error(error);
  };
}());