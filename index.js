document.getElementById("fileInput").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (file) {
    clearPreviousResults();
    Papa.parse(file, {
      header: true,
      complete: function (results) {
        processCSVData(results);

        document.getElementById("fileInput").value = "";
        document.getElementById("fileName").innerText = `Arquivo carregado: ${file.name}`;
      },
    });
  }
});

function clearPreviousResults() {
  document.getElementById("lineCount").innerText = "";
  document.getElementById("fileName").innerText = "";
  const taskChartCanvas = document.getElementById("taskChart");
  const tecnologiaChartCanvas = document.getElementById("tecnologiaChart");

  if (taskChartCanvas.chart) {
    taskChartCanvas.chart.destroy();
  }
  if (tecnologiaChartCanvas.chart) {
    tecnologiaChartCanvas.chart.destroy();
  }
}

function processCSVData(results) {
  const data = results.data;
  const estadoIndex = results.meta.fields.indexOf("Estado");
  const tipoTarefaIndex = results.meta.fields.indexOf("Tipo de tarefa");
  const usuarioIndex = results.meta.fields.indexOf("Recurso: Usuário");
  const tecnologiaIndex = results.meta.fields.indexOf("Objecto resultante: Tecnologia");
  const distanciaIndex = results.meta.fields.indexOf("Recurso: Utilizador (distância estimada (Kms))");

  if (estadoIndex === -1 || tipoTarefaIndex === -1 || usuarioIndex === -1 || tecnologiaIndex === -1 || distanciaIndex === -1) {
    document.getElementById("lineCount").innerText =
      'Coluna "Estado", "Tipo de tarefa", "Recurso: Usuário", "Objecto resultante: Tecnologia" ou "Recurso: Utilizador (distância estimada (Kms))" faltando';
    return;
  }

  const filteredData = filterData(data, estadoIndex);
  const { taskTypeCount, userTaskCount } = countTasks(filteredData, tipoTarefaIndex, usuarioIndex);
  const tecnologiaCount = countTecnologias(filteredData, tecnologiaIndex);
  const userPayments = calculateUserPayments(filteredData, usuarioIndex, distanciaIndex);
  updateResults(filteredData.length, taskTypeCount, userTaskCount, userPayments);
  createChart("taskChart", "Número de Tarefas por Tipo", "bar", taskTypeCount);
  createChart("tecnologiaChart", "Número de Tecnologias Instaladas", "pie", tecnologiaCount);
}

function filterData(data, estadoIndex) {
  return data.filter((row) => {
    if (!row["Estado"]) {
      return false;
    }
    const estado = row["Estado"].trim();
    return estado === "Fechada" || estado === "Cancelada";
  });
}

function countTasks(filteredData, tipoTarefaIndex, usuarioIndex) {
  const taskTypeCount = {};
  const userTaskCount = {};

  filteredData.forEach((row) => {
    const tipoTarefa = row["Tipo de tarefa"] ? row["Tipo de tarefa"].trim() : "";
    const usuario = row["Recurso: Usuário"] ? row["Recurso: Usuário"].trim() : "";

    if (tipoTarefa) {
      if (!taskTypeCount[tipoTarefa]) {
        taskTypeCount[tipoTarefa] = 0;
      }
      taskTypeCount[tipoTarefa]++;
    }

    if (usuario) {
      if (!userTaskCount[usuario]) {
        userTaskCount[usuario] = 0;
      }
      userTaskCount[usuario]++;
    }
  });

  return { taskTypeCount, userTaskCount };
}

function countTecnologias(filteredData, tecnologiaIndex) {
  const tecnologiaCount = {};

  filteredData.forEach((row) => {
    const tecnologia = row["Objecto resultante: Tecnologia"] ? row["Objecto resultante: Tecnologia"].trim() : "";

    if (tecnologia) {
      if (!tecnologiaCount[tecnologia]) {
        tecnologiaCount[tecnologia] = 0;
      }
      tecnologiaCount[tecnologia]++;
    }
  });

  return tecnologiaCount;
}

function calculateUserPayments(filteredData, usuarioIndex, distanciaIndex) {
  const userPayments = {};

  filteredData.forEach((row) => {
    const usuario = row["Recurso: Usuário"] ? row["Recurso: Usuário"].trim() : "";
    const distancia = row["Recurso: Utilizador (distância estimada (Kms))"] ? parseFloat(row["Recurso: Utilizador (distância estimada (Kms))"].trim()) : 0;

    if (usuario && distancia) {
      const payment = distancia * 2 * 1.5;
      if (!userPayments[usuario]) {
        userPayments[usuario] = 0;
      }
      userPayments[usuario] += payment;
    }
  });

  return userPayments;
}

function updateResults(totalTasks, taskTypeCount, userTaskCount, userPayments) {
  let resultText = `${totalTasks} Fechadas ou Canceladas\n\nTipos de Tarefas:\n`;
  for (const [tipo, count] of Object.entries(taskTypeCount)) {
    resultText += `${tipo}: ${count} tarefas\n`;
  }

  resultText += `\nTarefas por Instalador:\n`;
  for (const [usuario, count] of Object.entries(userTaskCount)) {
    const payment = userPayments[usuario] ? ` (R$ ${userPayments[usuario].toFixed(2)})` : " (---)";
    resultText += `${usuario}: ${count} tarefas${payment}\n`;
  }

  document.getElementById("lineCount").innerText = resultText;
}

function createChart(canvasId, label, type, data) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  const chart = new Chart(ctx, {
    type: type,
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          label: label,
          data: Object.values(data),
          backgroundColor: type === "pie" ? generateColors(Object.keys(data).length) : "#f36e21",
          borderColor: type === "pie" ? "#fff" : "#f36e21",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales:
        type === "bar"
          ? {
              y: {
                beginAtZero: true,
              },
            }
          : {},
    },
  });

  document.getElementById(canvasId).chart = chart;
}

function generateColors(count) {
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(`hsl(${Math.floor(Math.random() * 360)}, 100%, 75%)`);
  }
  return colors;
}
