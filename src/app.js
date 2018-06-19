import * as d3 from 'd3';
import * as c3 from 'c3';
import '../node_modules/c3/c3.css'
import './app.css';



async function fetchUrl(url) {
    try {
        // let request = new Promise((resolve, reject) => {
        let request = await fetch("https://openebench.bsc.es/monitor/metrics/"+url);
        // }) 
        
            
        let result = await request.text();
        
        return JSON.parse(result);
        // alert(result);
        
    }
    catch (err) {
        // console.log(`Error:`+err);
    }
}
function genChartData(citations,divid,title,dataH,dataW,fullName){
    const columsData = [];
    const xsData = {};
    const maxYear = new Date().getFullYear();
    const publicationsArray = citations.project.publications;
    publicationsArray.forEach(publication => {
        publication.entries.forEach(entry => {
            // console.log(entry.year);
            let minYear = entry.year;
            let tmpminYear = minYear;
            let tmp = {};
            for(minYear; minYear<=maxYear; minYear++){
                tmp[minYear]=0;
            }
            // console.log(tmp)
            let citation_tmp = {};
            let key = "";
            if(entry.pmid){
                key = 'PMID: '+entry.pmid+' ('+entry.cit_count+')';
                
                if(fullName=="true"){
                    key = entry.title?entry.title:'N/A'+' PMID: '+entry.pmid+' ('+entry.cit_count+')';
                };
            } else {
                key = 'Doi: '+entry.doi+' ('+entry.cit_count+')';
                
                if(fullName=="true"){
                    key = entry.title?entry.title:'N/A'+' Doi: '+entry.doi+' ('+entry.cit_count+')';
                };
            }

            entry.citations.forEach(citation => {
                if(citation.year>=tmpminYear-1){
                    citation_tmp[citation.year]=citation.count;
                }
            })
            // console.log(citation_tmp)

            // const stats = Object.keys(tmp).map(function(v, k){
            //     console.log(v , k);
            // })
            const stats = Object.assign(tmp,citation_tmp);
            const years = Object.keys(stats);
            const count = Object.values(stats);
            count.unshift(key);
            years.unshift(key+'y');
            columsData.push(years,count);
            xsData[key]=key+'y';
          
        })
    });
    populateChart(columsData,xsData,divid,title,dataH,dataW);
}




function populateChart(columsData,xsData,divid,title,dataH,dataW){
    const tickOptionsX = {
        
        format: d3.format('d'),
        outer: false,
    }
    const tickOptionsY = {
        
        outer: false,
        format: function(x) { return x % 1 === 0 ? x : ''; }
        
    }
    
    const chart = c3.generate({
        
        size: {
            height: dataH?dataH:'',
            width: dataW?dataW:'',
        },
        title:{
            text: title,
        },
        data: {
            xs:xsData,
                columns: columsData,
            },
            legend: {
                // position: 'bottom',
                show: true,
            },
            axis: {
                y:{
                    tick: tickOptionsY,
                    label: {
                        text: 'Citations',
                        position: 'outer-right'
                    },
                    min: 0,
                    padding: {
                        bottom: 5,
                    },
                },
                x:{
                    tick: tickOptionsX,
                    label: {
                        text: 'Year',
                        position: 'outer-right'
                    },
                    padding: {
                        right: 0.3,
                    },
                },
            },
            point : {
                show:true
            },
            bindto: '#'+divid,
            
            tooltip: {
                contents: function (d, defaultTitleFormat, defaultValueFormat, color) {

                    let $$ = this, config = $$.config,
                        titleFormat = config.tooltip_format_title || defaultTitleFormat,
                        nameFormat = config.tooltip_format_name || function (name) { return name; },
                        valueFormat = config.tooltip_format_value || defaultValueFormat,
                        text, i, title, value, name, bgcolor, total=0;
                    for (i = 0; i < d.length; i++) {
                        total = total+d[i].value;
                        if (! (d[i] && (d[i].value || d[i].value === 0))) { continue; }

                        if (! text) {
                            title = titleFormat ? titleFormat(d[i].x) : d[i].x;
                            text = "<table class='" + $$.CLASS.tooltip + "'>" + (title || title === 0 ? "<tr><th colspan='2'>" + title + "</th></tr>" : "");
                        }

                        name = nameFormat(d[i].name);
                        value = valueFormat(d[i].value, d[i].ratio, d[i].id, d[i].index);
                        bgcolor = $$.levelColor ? $$.levelColor(d[i].value) : color(d[i].id);

                        text += "<tr class='" + $$.CLASS.tooltipName + "-" + d[i].id + "'>";
                        text += "<td class='name'><span style='background-color:" + bgcolor + "'></span>" + name + "</td>";
                        text += "<td class='value'>" + value + "</td>";
                        text += "</tr>";
                    }
                    text += "<tr class='" + $$.CLASS.tooltipName +"'>";
                    text += "<td class='name'> Total </td>";
                    text += "<td class='value'>" + total + "</td>";
                    text += "</tr>";
                    return text + "</table>";
                },  
            }
    });

    // const legend = d3.select('.opebcitations').insert('div', '.class').attr('class', 'legend').selectAll('span').data(Object.keys(xsData));
    // // const legendSvg = legend.enter().append('svg');
    // const legendg = legend.enter().append('g')
    // .each(function (id) {
    //     d3.select(this).append("rect").attr('width','10').attr('height','10').style('border-left',chart.color(id))
    // })
    // const legendText = legendg.append('text').attr('data-id', function (id) { return id; }).style("margin","2px");
    // legendText.html(function (id) { return id; })
    // .on('mouseover', function (id) {
    //     chart.focus(id);
    // })
    // .on('mouseout', function (id) {
    //     chart.revert();
    // })
    // .on('click', function (id) {
    //     chart.toggle(id);
    // })
    // legendg.append("a").attr('href',function (id) {const pmidUrl = "https://www.ncbi.nlm.nih.gov/pubmed/"+id.split("PMID: ")[1].split(" ")[0]; return pmidUrl}).html("link").attr('target','_blank');
    
} 


function generateMessage(id,y,msg){
    const p = document.createElement("p");
    p.setAttribute("class","citationChartErrorMessage")
    p.innerHTML = msg;
    y.appendChild(p);

}

function loadCitationChart (){
    const x = document.getElementsByClassName("opebcitations");
    
    let i = 0;
    for(const y of x){
        try{
            i++;
            let msg = "";
            const dataId = y.getAttribute('data-id');
            const chartUrl = y.getAttribute('data-url');
            const title = y.getAttribute('data-title');
            const dataH = y.getAttribute('data-h');
            const dataW = y.getAttribute('data-w');
            const fullName = y.getAttribute('data-legend');
            const div = document.createElement("div");
            // console.log(i,y)
            const divid = dataId+i;
            div.id = divid
            y.appendChild(div);
            const citations = fetchUrl(chartUrl);
            citations.then(function(result) {
                try{
                    if(result.project.publications==0){
                        msg = "No publications found";
                        generateMessage(divid,y,msg);
                    } else {
                        genChartData(result,divid,title,dataH,dataW,fullName);
                    }
                    
                }
                catch (err) {
                    console.log("Error: incorrect data-url "+chartUrl);
                    msg = "Incorrect url"
                    generateMessage(divid,y,msg)
                }
            });            
        }catch(err){
            console.log(err);
        }
    }
}

loadCitationChart();
export{
    loadCitationChart
};










//Depricated
// function genChartDataB (citations,chartName){
//     console.log(citations);
//     const columsData = [];
//     const xsData = {};
//     for(let i of citations){
//         const years = Object.keys(i.citation_stats);
//         const count = Object.values(i.citation_stats);
//         count.unshift(i.id);
//         years.unshift(i.id+'y');
//         columsData.push(years,count);
//         xsData[i.id]=i.id+'y';
//     };
//     populateChart(columsData,chartName,xsData);
// }


// function genChartData(citations,chartName,title,dataH,dataW){

// const columsData = [];
// const xsData = {};

// for(const i of citations){
//     for(const y of i.found_pubs){
//         const temp = {};
//         const max = new Date().getFullYear();
//         let min = y.year;
//         // console.log(Object.keys(y.citation_stats)[0]);
//         for(min; min<=max; min++){
//             temp[min]=0;
//         }
//         const title = y.title;
//         const pmid = y.pmid;
//         const citation_count = y.citation_count;
//         const citation_stats_temp = y.citation_stats;
//         const citation_stats = Object.assign(temp,citation_stats_temp);
//         const years = Object.keys(citation_stats);
//         const count = Object.values(citation_stats);
//         let key = 'PMID: '+pmid+' ('+citation_count+')';
//         if(fullName=="true"){
//             key = title+' PMID: '+pmid+' ('+citation_count+')';
//         };
//         count.unshift(key);
//         years.unshift(key+'y');
//         columsData.push(years,count);
//         xsData[key]=key+'y';
//     }
// }
//     populateChart(columsData,xsData,chartName,title,dataH);
// }
//Depricated