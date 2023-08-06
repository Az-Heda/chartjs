function randomizeArray(arr) {
	let currentIndex = arr.length;
	let randomIndex;

	while (0 != currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex --;
		[arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
	}
	return arr;
}

function hashString (key) {
	key += "";
	var len = key.length;
	let code = 0
	for (let i = 0; i < len; ++i) {
		code += key.charCodeAt(i);
		code += (code << 10);
		code ^= (code >> 6);
	}
	code += (code << 3);
	code ^= (code >> 11);
	code += (code << 15);
	return Math.abs(code);
}

function sortObject (obj, sortFunction=null) {
	let keys = Object.keys(obj);
	let newObject = {};
	if (sortFunction) {
		keys.sort(sortFunction);
	}
	else {
		keys.sort();
	}
	for (let i = 0; i < keys.length; i ++) {
		let k = keys[i];
		newObject[k] = obj[k];
	}
	return newObject;
}

function encodeString(string) {
	newString = [];
	for (let pos = 0; pos < string.length; pos ++) {
		let lett = string.charCodeAt(pos);
		newString.push(lett);
	}
	return newString.join('|');
}

function decodeString(string) {
	return String.fromCharCode(...string.split('|'));
}

function addToStorage(key, value) {
	if (isStorageActive()) {
		window.localStorage.setItem(key, JSON.stringify(value));
		return Object.keys(window.localStorage).includes(key);
	}
	return false;
}

function getFromStorage(key) {
	if (isStorageActive()) {
		if (Object.keys(window.localStorage).includes(key)) {
			let value = window.localStorage.getItem(key);
			return JSON.parse(value);
		}
		return null;
	}
	return null;
}

function removeFromStorage(key) {
	if (isStorageActive()) {
		if (Object.keys(window.localStorage).includes(key)) {
			window.localStorage.removeItem(key);
			return true;
		}
		return false;
	}
	return null;
}

function clearStorage() {
	if (isStorageActive()) {
		window.localStorage.clear();
		return window.localStorage.length == 0;
	}
	return false;
}

function isStorageActive() {
	return typeof Storage !== undefined;
}

function setCookie(key, value, expr=60*60*1000) {
	// https://www.sohamkamani.com/javascript/localstorage-with-ttl-expiry/
	const now = new Date();
	const item = {
		value: value,
		expiry: now.getTime() + expr
	};
	window.localStorage.setItem(key, JSON.stringify(item))
}

function readCookie(key) {
	const itemStr = window.localStorage.getItem(key);
	if (!itemStr) {
		return null;
	}
	const item = JSON.parse(itemStr);
	const now = new Date();
	if (now.getTime() > item.expiry) {
		window.localStorage.removeItem(key);
		return null;
	}
	return item.value;
}

function hasAccess() {
	let access = readCookie('user-access');
	return access;
}

function isLoggedIn() {
	let username = readCookie('username');
	let password = readCookie('password');
	return (username !== null && password !== null)
}

function logout() {
	removeFromStorage('username');
	removeFromStorage('password');
	document.location.reload();
}

async function loginTimer(id) {
	return new Promise((resolve) => {
		let interval = setInterval(() => {
			let time = getFromStorage('username');
			let diff = time.expiry - Date.now();
			if (diff < 0) {
				removeFromStorage('username');
				removeFromStorage('password');
				clearInterval(interval);
				resolve(id);
			}
			else {
				document.getElementById(id).innerHTML = new Date(diff).toISOString().substr(11, 8);
			}
		}, 200);
	})
}

function scrollUp() {
	$('html, body').animate({scrollTop: 0}, 'fast');
}

function isValidUrl(urlString) {
	try {
		return Boolean(new URL(urlString))
	}
	catch (e) {
		return false;
	}
}

function savePreloadData(key, data) {
	if (isStorageActive()) {
		let time =  1000*60*60*24*7;
		// time = 1000 * 60 * 2;
		setCookie(key, data, time); // 1 settimana
	}
}

function restorePreloadData(key, callback) {
	if (isStorageActive()) {
		let data = readCookie(key);
		if (data && typeof callback == 'function') {
			callback(data);
		}
		else {
			console.log('Dati/callback non esistenti')
		}
	}
}

function keySensetive(fname) {
	if (!Object.keys(global).includes('wait')) {
		global['wait'] = false;
	}
	document.body.addEventListener('keydown', async (event) => {
		let excludedInputs = [];
		let canExecute = true;
		Array.from(document.getElementsByTagName('input')).forEach((i) => {
			let types = [ 'text', 'password', 'number' ];
			if (types.includes(i.getAttribute('type'))) {
				excludedInputs.push(i);
			}
		});
		if (excludedInputs.length > 0) {
			let activeElement = document.activeElement;
			excludedInputs.forEach((i) => {
				if (canExecute && activeElement == i) {
					canExecute = false;
				}
			});
		}
		let data = {
			key: String.fromCharCode(event.keyCode),
			code: event.keyCode
		}
		if (data.code >= 48 && data.code <= 57) {
			// Numeri 0-9 (tastiera princiaple)
			data.key = '0-9';
		}

		// fname(event)
		if (typeof fname == 'function' && canExecute) {
			if (!global['wait']) {
				// console.log(data);
				global['wait'] = true;
				let val = await fname(data.key);
				global['wait'] = false;
			}
		}
	})
}

class Loader {
    constructor() {
        this.loader = document.createElement('div');
        this.loader.setAttribute('class', 'cube');
        this._styleLoader();
        this.sides = [];
        for (let pos = 0; pos < 6; pos ++) {
            let side = document.createElement('div');
            side.setAttribute('class', 'side');
            this.sides.push(side);
        }
        this.sides.forEach((s) => {
            this.loader.appendChild(s);
        })
    }

    _styleLoader() {
        let styles = {
           'position': 'fixed',
           'top': '50%',
           'left': '50%',
           'z-index': '1', 
        };
        let keys = Object.keys(styles);
        let values = keys.map((item) => { return `${item}: ${styles[item]}` }).join('; ');
        this.loader.setAttribute('style', values);
    }

    show() {
        if (this.loader !== null) {
            let body = document.getElementsByTagName('body')[0];
            body.appendChild(this.loader);
        }
        else {
            console.log('Errore, loader non ha un valore');
        }
    }

    remove() {
        this.loader.remove();
    }
}

let global = {
	'loader': new Loader(),
	// 'wait': false
};

setTimeout(() => {
	// console.clear();
	removeFromStorage('admin-data');
	let keys = Object.keys(window.localStorage);
	for (let pos = 0; pos < keys.length; pos ++) {
		let data1 = getFromStorage(keys[pos]);
		if (Object.keys(data1).includes('expiry')) {
			readCookie(keys[pos]);
		}
	}
}, 500);