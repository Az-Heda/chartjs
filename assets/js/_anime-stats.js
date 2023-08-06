global['ready'] = false;
global['default'] = {
	'agg-operation': 'count',
	'charts': {
		'title': {
			'display': false,
			'text': 'Nuovo grafico',
			'font': {
				'size': 20
			}
		},
		'legend': {
			'display': true,
			'position': 'bottom',
			'align': 'center'
		}
	}
};

function showGraphs() {
	let statusNames = { 0: 'Finiti', 1: 'In uscita', 2: 'Iniziati', 3: 'Da vedere', };
	global['charts'] = [];

	global['charts'].push(newChart('test1', 'bar', ...getChartData(global['data'].map((item) => {
		let copy = JSON.parse(JSON.stringify(item));
		copy.published = copy.published.split('-').splice(0,2).join('-')+'-*';
		return copy;
	}), 'published', { operation: 'count', customNames: statusNames, order: 'asc' }, 'Numero anime'), 'Numero di anime', {
		legend: { display: false  },
		title: { display: true, text: 'Data d\'uscita degli anime', font: { size: 20 } }
	}));

	global['charts'].push(newChart('test2', 'doughnut', ...getChartData(global['data'], 'status', {
		operation: 'count', customNames: statusNames, order: 'asc'
	}), 'Numero anime', {
		legend: { position: 'bottom', align: 'center'},
		title: { display: true, text: 'Situazione anime', font: { size: 20 } }
	}));

	global['charts'].push(newChart('test3', 'bar', ...getChartData(global['data'], 'isMovie', {
		operation: 'count', customNames: { 'S': 'Movie', 'N': 'Anime' }, order: 'asc'
	}), 'Numero anime', {
		title: { display: true, text: 'Anime vs Film', font: { size: 20 }},
		legend: { display: false 
		}
	}));


	global['table'] = [new Table('table-test', global['data'])];
}

/**
 * @param {String} id id del contenitore HTML
 * @param {String} type Tipo di grafico da disegnare
 * @param {list<String>} labels Labels del grafico
 * @param {list<Any>} data Dati del grafico
 * @param {String} datasetLabel Label associata a tutti i valori del dataset
 * 
 * @param {object} options Impostazioni aggiuntive del grafico
 * * options -> title -> display (true | false) : Mostra/rimuovi il titolo del grafico
 * * options -> title -> text <String> : Imposta il titolo del grafico
 * * options -> title -> font -> size <Number> : Imposta la dimensione del font
 * * options -> legend -> display (true | false) : Mostra/rimuovi la legenda
 * * options -> legend -> position ("top" | "bottom" | "right" | "left") : Imposta la posizione della legenda
 * * options -> legend -> align	("start" | "center" | "end") : Imposta l'allineamento della legenda
 * @returns {ChartJSObject}
 */
function newChart(id, type, labels=[], data=[], datasetLabel='#', options={}) {
	let container = document.getElementById(id);
	let chart = null;
	if (container && labels.length > 0 && data.length > 0) {
		let config = {
			type: type,
			data: {
				labels: labels,
				datasets: [
					{
						label: datasetLabel,
						data: data,
						borderWidth: 1,
					},
				],
			},
			options: {
				responsive: true,
				plugins: {
					title: {
						display: (Object.keys(options).includes('title')) ?
									(Object.keys(options['title']).includes('display')) ?
									options['title']['display'] :
									global['default']['charts']['title']['display'] : global['default']['charts']['title']['display'],
						text: (Object.keys(options).includes('title')) ?
									(Object.keys(options['title']).includes('text')) ?
									options['title']['text'] :
									global['default']['charts']['title']['text'] :
									global['default']['charts']['title']['text'],
						font: {
							size: (Object.keys(options).includes('title')) ?
									(Object.keys(options['title']).includes('font')) ? 
									(Object.keys(options['title']['font']).includes('size')) ?
									options['title']['font']['size'] :
									global['default']['charts']['title']['font']['size'] :
									global['default']['charts']['title']['font']['size'] :
									global['default']['charts']['title']['font']['size'],
						}
					},
					legend: {
						display: (Object.keys(options).includes('legend')) ?
									(Object.keys(options['legend']).includes('display')) ?
									options['legend']['display'] :
									global['default']['charts']['legend']['display'] :
									global['default']['charts']['legend']['display'],
						position: (Object.keys(options).includes('legend')) ?
									(Object.keys(options['legend']).includes('position')) ?
									options['legend']['position'] :
									global['default']['charts']['legend']['position'] :
									global['default']['charts']['legend']['position'],
						align: (Object.keys(options).includes('legend')) ?
									(Object.keys(options['legend']).includes('align')) ?
									options['legend']['align'] :
									global['default']['charts']['legend']['align'] :
									global['default']['charts']['legend']['align'],
					}
				}
			},
		}

		chart = new Chart(container, config);
		container.onclick = (event) => {
			applyFilters(event, { chart, id, type, labels, data, datasetLabel, options, config, container });
		}
	}
	return chart;
}

/**
 * @param {list<object>} data Lista dei dati su cui costruire il grafico
 * @param {String} key Chiave dell'oggetto "data" per prendere i dati corretti
 * 
 * @param {object} options Optioni aggiuntive per l'elaborazione dei dati
 * * options -> operation ("count" | "sum" | "min" | "max") : Imposta la funzione di aggregazione da usare sui dati
 * * options -> order ("asc" | "desc" | function<Any>) : Cambia l'ordine dei dati
 * * options -> customNames <object> Cambia i valori delle chiavi comuni tra customNames e delle labels con i valori indicati
 * @returns {list<list<String>,list<Number>} Restituisce una lista [Chiavi, valori] da usare per i grafici di ChartJS
 */
function getChartData(data, key, options={ operation: null, order: 'asc', customNames: {} }) {
	options.order = (typeof options.order == 'function') ? options.order :
					(options.order == 'asc') ? (a, b) => { return (a < b) ? -1 : (a > b) ? 1 : 0 } :
					(options.order == 'desc') ? (a, b) => { return (a < b) ? 1 : (a > b) ? -1 : 0 } : null;
	if (!options.operation) {
		options.operation = global['default']['agg-operation'];
	}
	if (!['count', 'sum', 'min', 'max'].includes(options.operation)) {
		throw Error(`Funzione di aggregazione ${options.operation} non valida`);
	}
	let values = {};
	data.forEach((d) => {
		if (Object.keys(d).includes(key)) {
			if (Object.keys(values).includes(d[key]+'')) {
				values[d[key]+''] = (options.operation == 'count') ? values[d[key]+''] + 1 :
									(options.operation == 'sum') ? values[d[key]+''] + d[key] :
									(options.operation == 'min') ? Math.min(values[d[key]+''], d[key]) :
									(options.operation == 'max') ? Math.max(values[d[key]+''], d[key]) : values[d[key]+''];
			}
			else {
				values[d[key]+''] = (options.operation == 'count') ? 1 : d[key];
			}
		}
	})	
	console.log(values);
	values = sortObject(values, options.order);
	return [Object.keys(values).map((item) => {
		if (Object.keys(options.customNames).includes(item)) {
			return options.customNames[item];
		}
		return item;
	}), Object.values(values)];
}

/**
 * @param {Event} event Evento di javascript, si attiverà quando verrà cliccato qualcosa in un grafico
 * @param {object} data Contiene tutti i parametri che sono stati usati per la creazione del grafico
 * @returns 
 */
function applyFilters(event, data) {
	const res = data.chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
	if (res.length === 0) { return null }
	console.log({ filter: data.chart.data.labels[res[0].index], data});
}




class Table {
	constructor(id, data) {
		this.id = id;
		this.container = document.getElementById(id);
		this.data = JSON.parse(JSON.stringify(data));

		this.container.style.overflowY = 'auto';
		this.container.style.overflowX = 'hidden';
		this.container.style.maxHeight = '50vh';

		this.tableStyles = {
			'width': '100%',
		};

		this.show();
	}

	show() {
		if (this.container) {
			this.container.innerHTML = '';

			let table = document.createElement('table');

			table.setAttribute('style', Object.keys(this.tableStyles).map((key) => { return `${key}: ${this.tableStyles[key]}`}).join('; '));

			let thead = document.createElement('thead');
			let tbody = document.createElement('tbody');

			let theadRow = document.createElement('tr');
			this.getKeys().forEach((k) => {
				let cell = document.createElement('th');
				cell.innerHTML = k;
				theadRow.appendChild(cell);
			});

			this.data.forEach((d) => {
				let tbodyRow = document.createElement('tr');
				tbodyRow.setAttribute('style', 'max-height: 20px')
				this.getKeys().forEach((k) => {
					let cell = document.createElement('td');
					cell.innerText = d[k];
					tbodyRow.appendChild(cell);
				})
				tbody.appendChild(tbodyRow);
			})

			thead.appendChild(theadRow);
			table.appendChild(thead);
			table.appendChild(tbody);
			this.container.appendChild(table);
		}
	}

	getKeys(keysToRemove=['description']) {
		let keys = Object.keys(this.data[0]);
		return keys.filter((k) => { return !keysToRemove.includes(k)});
	}
}