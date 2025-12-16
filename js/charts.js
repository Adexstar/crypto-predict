
// Candlestick-like mock using lightweight-charts if present; otherwise fallback.
function makeOHLC(count=60, base=100){
  const out = [];
  let t = Date.now()-count*60000;
  let last = base;
  for(let i=0;i<count;i++){
    const open = last + (Math.random()-0.5)*4;
    const close = open + (Math.random()-0.5)*8;
    const high = Math.max(open,close) + Math.random()*4;
    const low = Math.min(open,close) - Math.random()*4;
    out.push({ time: Math.floor((t + i*60000)/1000), open: +open.toFixed(2), high:+high.toFixed(2), low:+low.toFixed(2), close:+close.toFixed(2), volume: Math.round(100+Math.random()*900) });
    last = close;
  }
  return out;
}

function renderCandle(elId){
  const el = document.getElementById(elId);
  if(!el) return null;
  // try lightweight-charts global
  if(window.LightweightCharts){
    const chart = window.LightweightCharts.createChart(el,{layout:{background:'#ffffff',textColor:'#000'},width:el.clientWidth,height:320});
    const series = chart.addCandlestickSeries();
    const data = makeOHLC(120, 10000);
    series.setData(data);
    // volume
    const vol = chart.addHistogramSeries({color:'#26a69a', priceFormat:{type:'volume'}});
    vol.setData(data.map(d=>({time:d.time,value:d.volume})));
    // simulate updates
    setInterval(()=>{
      const newData = makeOHLC(1, data[data.length-1].close);
      series.update(newData[0]); vol.update({time:newData[0].time,value:newData[0].volume});
    },2000);
    return chart;
  } else if(window.Chart){
    // fallback: draw line + bars with Chart.js on canvas
    const ctx = el.querySelector('canvas').getContext('2d');
    const data = makeOHLC(120, 10000);
    const labels = data.map((d,i)=>i);
    const price = data.map(d=>d.close);
    const vol = data.map(d=>d.volume);
    const chart = new Chart(ctx,{
      type:'bar',
      data:{ labels, datasets:[{type:'line',label:'Price',data:price, borderColor:'#1e6fff', tension:0.2, fill:false},{type:'bar',label:'Volume',data:vol, backgroundColor:'#cde6ff', yAxisID:'v'}]},
      options:{responsive:true, scales:{v:{display:false}, y:{display:true}}}
    });
    setInterval(()=>{
      const n = makeOHLC(1,data[data.length-1].close)[0];
      data.shift(); data.push(n);
      chart.data.labels = data.map((d,i)=>i);
      chart.data.datasets[0].data = data.map(d=>d.close);
      chart.data.datasets[1].data = data.map(d=>d.volume);
      chart.update('none');
    },2000);
    return chart;
  }
  return null;
}

export { renderCandle, makeOHLC };
