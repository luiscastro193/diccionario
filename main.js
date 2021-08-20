"use strict";
var dictionary;
var fileInput = document.querySelector('input[type=file]');
var searchInput = document.querySelector('input[type=search]');
var errorMsg = document.querySelector('#errorMsg');
var results = document.querySelector('ul');
var lang = document.querySelector('#lang');
var favRef = document.querySelector('#favRef');
const max_results = 50;

var references = {
	"inglés": {
		WordReference: "https://www.wordreference.com/es/translation.asp?tranword=",
		Cambridge: "https://dictionary.cambridge.org/es/buscar/direct/?datasetsearch=english&q=",
		Collins: "https://www.collinsdictionary.com/es/buscar/?dictCode=english&q=",
		Wiktionary: "https://en.wiktionary.org/w/index.php?search=",
		Google: "https://www.google.es/search?q="
	},
	"alemán": {
		Pons: "https://es.pons.com/traducci%C3%B3n?l=dees&q=",
		Linguee: "https://www.linguee.es/espanol-aleman/search?source=aleman&query=",
		WordReference: "https://www.wordreference.com/redirect/translation.aspx?dict=deen&w=",
		Wiktionary: "https://de.wiktionary.org/w/index.php?search=",
		Google: "https://www.google.es/search?q="
	},
	"italiano": {
		WordReference: "https://www.wordreference.com/redirect/translation.aspx?dict=ites&w=",
		WordReferenceEn: "https://www.wordreference.com/redirect/translation.aspx?dict=iten&w=",
		Contexto: "https://context.reverso.net/translation/italian-english/",
		Linguee: "https://www.linguee.com/english-italian/search?source=italian&query=",
		Google: "https://www.google.es/search?q="
	}
};

function waitForGlobal(name) {
	return new Promise(resolve => {
		if (window[name])
			return resolve();
		
		document.head.querySelector(`[meta-id=${name}]`).addEventListener('load', () => resolve());
	});
}

async function getPdfText(file) {
	await waitForGlobal('pdfjsLib');
	let pdf = await pdfjsLib.getDocument(file).promise;
	let pages = Array.from({length: pdf.numPages}, (_, i) => i + 1)
		.map(index => pdf.getPage(index).then(page => page.getTextContent())
			.then(text => text.items.map(item => item.str).join('\n')));
	return (await Promise.all(pages)).join('\n');
} 

function fileToText(file) {
	return new Promise((resolve, reject) => {
		let reader = new FileReader();
		reader.onerror = () => reject("Error al cargar el archivo");
		
		if (file.name.substring(file.name.lastIndexOf('.')+1).toLowerCase() == "pdf") {
			reader.onload = event => getPdfText(event.target.result).then(text => resolve(text)).catch(error => reject(error.message));
			reader.readAsArrayBuffer(file);
		}
		else {
			reader.onload = event => resolve(event.target.result);
			reader.readAsText(file);
		}
	});
}

function extractWords(text) {
	let expression = /\p{L}+(?:-[\r\n]*\p{L}+)*/gu;
	return [...new Set(text.replace(/-[\r\n]+/g, '').toLowerCase().match(expression))];
}

function loadFile() {
	searchInput.disabled = true;
	errorMsg.textContent = "Cargando...";
	
	fileToText(fileInput.files[0]).then(text => {
		dictionary = extractWords(text);
		searchInput.disabled = false;
		searchInput.focus();
		errorMsg.textContent = '';
	}).catch(error => errorMsg.textContent = error);
}

fileInput.onchange = loadFile;

if (fileInput.value)
	loadFile();

function addExtraLinks(item, word) {
	if (item.childElementCount <= 1) {
		item.append(...Object.entries(references[lang.value]).filter(([key, _]) => key != favRef.value).map(([key, reference]) => {
			let a = document.createElement("a");
			a.textContent = "en " + key;
			a.href = reference + word;
			a.target = "_blank";
			a.rel = "noopener";
			a.tabIndex = 2;
			return a;
		}));
	}
}

function toListItem(word) {
	let newItem = document.createElement("li");
	let a = document.createElement("a");
	
	a.textContent = word;
	a.href = references[lang.value][favRef.value] + word;
	a.target = "_blank";
	a.rel = "noopener";
	a.onclick = () => addExtraLinks(newItem, word);
	a.tabIndex = 3;
	
	newItem.appendChild(a);
	return newItem;
}

function openLast() {
	if (results.lastChild)
		results.lastChild.firstChild.click();
}

function updateResults() {
	results.innerHTML = '';
	
	if (searchInput.disabled)
		return;
	
	let searchString = searchInput.value.toLowerCase();
	let matches = dictionary.filter(word => word.includes(searchString));
	
	if (matches.length > max_results)
		matches.length = max_results;
	
	results.append(...matches.map(toListItem));
	
	if (matches.length == 1)
		openLast();
}

searchInput.oninput = updateResults;
favRef.onchange = updateResults;

function toOption(reference) {
	let option = document.createElement("option");
	option.textContent = reference;
	return option;
}

lang.onchange = () => {
	favRef.innerHTML = '';
	favRef.append(...Object.keys(references[lang.value]).map(toOption));
	updateResults();
	document.title = `Diccionario ${lang.value}-español`;
}

if (lang.value != lang.firstChild.value)
	lang.onchange();

document.querySelector('form').onsubmit = event => {
	event.preventDefault();	
	openLast();
};

window.addEventListener('focus', () => searchInput.focus());
