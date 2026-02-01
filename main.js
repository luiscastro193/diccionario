"use strict";
import references from "./references.json" with {type: "json"};

let dictionary;
let fileInput = document.querySelector('input[type=file]');
let searchInput = document.querySelector('input[type=search]');
let errorMsg = document.querySelector('#errorMsg');
let results = document.querySelector('ul');
let lang = document.querySelector('#lang');
let favRef = document.querySelector('#favRef');
const max_results = 50;

const pdfjsLibPromise = import("https://cdn.jsdelivr.net/npm/pdfjs-dist/build/pdf.min.mjs").then(pdfjsLib => {
	pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
	return pdfjsLib;
});

async function getPageText(i, pdf) {
	return (await (await pdf.getPage(i+1)).getTextContent()).items.map(item => item.str).join('\n');
}

async function getPdfText(file) {
	const pdfjsLib = await pdfjsLibPromise;
	let pdf = await pdfjsLib.getDocument(file).promise;
	let pages = Array.from({length: pdf.numPages}, (_, i) => getPageText(i, pdf));
	return (await Promise.all(pages)).join('\n');
} 

async function fileToText(file) {
	return file.name.toLowerCase().endsWith(".pdf") ? getPdfText(await file.arrayBuffer()) : file.text();
}

function extractWords(text) {
	let expression = /\p{L}+(?:\p{Pd}\p{L}+)*/gu;
	return [...new Set(text.normalize().replace(/\p{Pd}$\s+/gmu, '').replace(/\p{Pd}/gu, '-').toLowerCase().match(expression))];
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

function addExtraLinks(item, wordComponent) {
	if (item.childElementCount <= 1) {
		item.append(...Object.entries(references[lang.value]).filter(([key, _]) => key != favRef.value).map(([key, reference]) => {
			let a = document.createElement("a");
			a.textContent = "en " + key;
			a.href = reference + wordComponent;
			a.target = "_blank";
			a.tabIndex = 2;
			return a;
		}));
	}
}

function toListItem(word) {
	const wordComponent = encodeURIComponent(word);
	let newItem = document.createElement("li");
	let a = document.createElement("a");
	
	a.textContent = word;
	a.href = references[lang.value][favRef.value] + wordComponent;
	a.target = "_blank";
	a.onclick = () => addExtraLinks(newItem, wordComponent);
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
	
	let searchString = searchInput.value.normalize().toLowerCase();
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
