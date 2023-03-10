const map = L.map('map', {preferCanvas: false}).setView([37.93, -121.95], 11);

let osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

let data = {};
let precinctsLayer;

(async () => {
    data = await loadData();
    let precincts = await loadJson("data/precincts.gis.json");

    precinctsLayer = L.geoJSON(precincts, {
        style: feature => {
            return {
                fillOpacity: 1,
                weight: 1,
                color: "#AAAAAA"
            }
        },
        onEachFeature: (feature, layer) => {
            layer.on({
                click: e => {
                    let contest = data.contests[selector.selection.contest];
                    let choice = contest.choices[selector.selection.choice];
                    let precinct = contest.precincts[e.target.feature.properties.PrecinctID];
                    e.target.setStyle({
                        weight: 2,
                        color: "#FFFFFF"
                    }).bringToFront();
                    
                    let content;

                    if(!precinct) content = `
                        <p class="popup-title">${e.target.feature.properties.PrecinctID}<br/></p>
                        No Election Results
                        `;
                    else if(precinct.total == 0) content = `
                        <p class="popup-title">${precinct.label}<br/>
                        No Votes
                        </p>
                        Total Votes: ${precinct.total}<br/>
                        `;
                    else if(!precinct.results) content = `
                        <p class="popup-title">${precinct.label}<br/>
                        Hidden for Privacy
                        </p>
                        Total Votes: ${precinct.total}<br/>
                        `;
                    else if(selector.selection.choice === 'w') content = `
                        <p class="popup-title">${precinct.label}<br/>
                        ${contest.choices[precinct.winner].label}
                        </p>
                        Votes: ${precinct.results ? precinct.results[precinct.winner] : 0}/${precinct.total} (${precinct.percentage ? (100 * precinct.percentage[precinct.winner]).toFixed(0) : 0}%)<br/>
                        `;
                    else content = `
                        <p class="popup-title">${precinct.label}<br/>
                        ${choice.label}
                        </p>
                        Votes: ${precinct.results ? precinct.results[selector.selection.choice] : 0}/${precinct.total} (${precinct.percentage ? (100 * precinct.percentage[precinct.winner]).toFixed(0) : 0}%)<br/>
                        `;

                    L.popup()
                    .setLatLng(e.latlng)
                    .setContent(content)
                    .on({remove: () => e.target.setStyle({
                        weight: 1,
                        color: "#AAAAAA"
                    })}).openOn(map);
                }
            });
        }
    }).addTo(map);
    
    let selector = L.control.ElectionSelector(precinctsLayer, data.contests).addTo(map);
})();

async function loadData(){
    let data = await loadJson("data/data.json");

    return data;
}

async function loadJson(file) {
    let response = await fetch(file);
    return await response.json();
}