import * as d3 from "d3";
import * as c3 from "c3";
import "../node_modules/c3/c3.css";
import "./app.css";

async function fetchUrl(url, mode) {
  const baseUrl = mode ? "dev-openebench" : "openebench";
  const endpoint = `https://${baseUrl}.bsc.es/monitor/metrics/${url}`;
  let jsonResponse;
  await fetch(endpoint)
    .then((response) => response.json())
    .then((data) => (jsonResponse = data));
  return jsonResponse;
}

function genChartData(citations, divId, title, dataH, dataW, fullName) {
  const columsData = [];
  const xsData = {};
  const maxYear = new Date().getFullYear();
  const publicationsArray = citations.project.publications;
  publicationsArray.forEach((publication) => {
    publication.entries.forEach((entry) => {
      let minYear = entry.year;
      if (minYear != null) {
        let tmpminYear = minYear;
        let tmp = {};
        for (minYear; minYear <= maxYear; minYear++) {
          tmp[minYear] = 0;
        }
        let citation_tmp = {};
        let key = "";
        if (entry.pmid) {
          key = "PMID: " + entry.pmid + " (" + entry.cit_count + ")";
          if (fullName == "true") {
            key = entry.title
              ? entry.title + " (" + entry.cit_count + ")"
              : "N/A" + " PMID: " + entry.pmid + " (" + entry.cit_count + ")";
          }
        } else {
          key = "Doi: " + entry.doi + " (" + entry.cit_count + ")";
          if (fullName == "true") {
            key = entry.title
              ? entry.title + " (" + entry.cit_count + ")"
              : "N/A" + " Doi: " + entry.doi + " (" + entry.cit_count + ")";
          }
        }
        entry.citations.forEach((citation) => {
          if (citation.year >= tmpminYear - 1) {
            citation_tmp[citation.year] = citation.count;
          }
        });
        const stats = Object.assign(tmp, citation_tmp);
        const years = Object.keys(stats);
        const count = Object.values(stats);
        count.unshift(key);
        years.unshift(key + "y");
        columsData.push(years, count);
        xsData[key] = key + "y";
      }
    });
  });
  populateChart(columsData, xsData, divId, title, dataH, dataW);
}

function populateChart(columsData, xsData, divId, title, dataH, dataW) {
  const tickOptionsX = {
    format: d3.format("d"),
    outer: false,
  };
  const tickOptionsY = {
    outer: false,
    format: function (x) {
      return x % 1 === 0 ? x : "";
    },
  };
  const chart = c3.generate({
    size: {
      height: dataH ? dataH : "",
      width: dataW ? dataW : "",
    },
    title: {
      text: title,
    },
    data: {
      xs: xsData,
      columns: columsData,
    },
    legend: {
      // position: 'bottom',
      show: true,
    },
    axis: {
      y: {
        tick: tickOptionsY,
        label: {
          text: "Citations",
          position: "outer-right",
        },
        min: 0,
        padding: {
          bottom: 5,
        },
      },
      x: {
        tick: tickOptionsX,
        label: {
          text: "Year",
          position: "outer-right",
        },
        padding: {
          right: 0.3,
        },
      },
    },
    point: {
      show: true,
    },
    bindto: "#" + divId,
    tooltip: {
      contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
        let $$ = this,
          config = $$.config,
          titleFormat = config.tooltip_format_title || defaultTitleFormat,
          nameFormat =
            config.tooltip_format_name ||
            function (name) {
              return name;
            },
          valueFormat = config.tooltip_format_value || defaultValueFormat,
          text,
          i,
          title,
          value,
          name,
          bgcolor,
          total = 0;
        for (i = 0; i < d.length; i++) {
          total = total + d[i].value;
          if (!(d[i] && (d[i].value || d[i].value === 0))) {
            continue;
          }
          if (!text) {
            title = titleFormat ? titleFormat(d[i].x) : d[i].x;
            text =
              "<table class='" +
              $$.CLASS.tooltip +
              "'>" +
              (title || title === 0
                ? "<tr><th colspan='2'>" + title + "</th></tr>"
                : "");
          }
          name = nameFormat(d[i].name);
          value = valueFormat(d[i].value, d[i].ratio, d[i].id, d[i].index);
          bgcolor = $$.levelColor ? $$.levelColor(d[i].value) : color(d[i].id);
          text += "<tr class='" + $$.CLASS.tooltipName + "-" + d[i].id + "'>";
          text +=
            "<td class='name'><span style='background-color:" +
            bgcolor +
            "'></span>" +
            name +
            "</td>";
          text += "<td class='value'>" + value + "</td>";
          text += "</tr>";
        }
        text += "<tr class='" + $$.CLASS.tooltipName + "'>";
        text += "<td class='name'> Total </td>";
        text += "<td class='value'>" + total + "</td>";
        text += "</tr>";
        return text + "</table>";
      },
    },
  });
}

function generateMessage(id, y, msg) {
  const p = document.createElement("p");
  p.id = "errorMessage";
  p.setAttribute("class", "citationChartErrorMessage");
  p.text = msg;
  y.appendChild(p);
}

function loadCitationChart() {
  const x = document.getElementsByClassName("opebcitations");
  let i = 0;
  for (const y of x) {
    try {
      i++;
      let msg = "";
      const dataId = y.getAttribute("data-id");
      const chartUrl = y.getAttribute("data-url");
      const title = y.getAttribute("data-title");
      const dataH = y.getAttribute("data-h");
      const dataW = y.getAttribute("data-w");
      const fullName = y.getAttribute("data-legend");
      const mode = y.getAttribute("dev");
      const div = document.createElement("div");
      const divId = dataId + i;
      div.id = divId;
      y.appendChild(div);
      let citations;
      fetchUrl(chartUrl, mode).then((data) => (citations = data));
      citations.then(function (result) {
        try {
          if (result.project.publications == 0) {
            msg = "No publications found";
            generateMessage(divId, y, msg);
          } else {
            genChartData(result, divId, title, dataH, dataW, fullName);
          }
        } catch (err) {
          msg = "Incorrect url";
          generateMessage(divId, y, msg);
        }
      });
    } catch (err) {
      console.log(err);
    }
  }
}

loadCitationChart();
export { loadCitationChart };
