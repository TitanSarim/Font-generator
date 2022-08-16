String.prototype.unicodeAwareSplit = function() {
	let _arr = [];
	for (const _c of this.valueOf()) {
		_arr.push(_c);
	}
	return _arr;
}

String.prototype.toAlternateCase = function() {
	let _arr = [];
	let _alternate = true;
	for (const _c of this.valueOf()) {
		if (_alternate) {
			_alternate = false;
			_arr.push(_c.toUpperCase());
		} else {
			_alternate = true;
			_arr.push(_c.toLowerCase());
		}
	}
	return _arr.join('');
};

/* PseudoFont: Unicode Font Parser & Converter */
class PseudoFont {
	constructor(fontName, fontLower, fontUpper, fontDigits) {
		this.fontName = fontName;
		
		// splitting because otherwise JavaScript won't handle the characters properly.
		this.fontLower = fontLower.unicodeAwareSplit();
		this.fontUpper = fontUpper.unicodeAwareSplit();
		this.fontDigits = fontDigits.unicodeAwareSplit();
		
		this.referenceLower = "abcdefghijklmnopqrstuvwxyz";
		this.referenceUpper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		this.referenceDigits = "0123456789";
	}
	
	convert(rawText) {
		let _converted = "";
		for (const _char of rawText) {
			if (this.referenceLower.includes(_char)) {
				// if character is lowercase
				_converted += this.fontLower[this.referenceLower.indexOf(_char)];
			} else if (this.referenceUpper.includes(_char)) {
				// if character is uppercase
				_converted += this.fontUpper[this.referenceUpper.indexOf(_char)];
			} else if (this.referenceDigits.includes(_char)) {
				// if character is digit
				_converted += this.fontDigits[this.referenceDigits.indexOf(_char)];
			} else {
				_converted += _char;
			}
		}
		return _converted;
	}
}




var convertAll = false;  // whether to convert and display all available fonts or not.
var randomText = "The quick brown fox jumps over the lazy dog.";  // random text used for placeholder if user input is null.
var userInput = ""; // input from the user (updated on keyup)
var selectedFont = "";  // the font the user selected.
var selectedStyle = "";  // the font style the user selected.
var fonts = [];   // all the fonts that the user can choose from

/* Elements */
const e_inputTextArea = document.getElementById('input-text-area');
const e_fontSelect = document.getElementById('font-select');
const e_fontStyleSelect = document.getElementById('font-style-select');
const e_viewAllConversions = document.getElementById('view-all-conversions');
const e_viewall_container = document.getElementById('viewall-container');

const e_outputText = document.getElementById('output-text');
const e_outputList = document.getElementById('output-list');
const e_copytext = document.getElementById('copy-text');

const e_accessibilityWarning = document.getElementById('accessibility-warning');

// Fetch the fonts.json file and set everything up.
// To-Do: add a fallback in case the fonts can't be fetched (in case of running offline or something)
fetch("fonts.json")
.then(response => response.json())
.then(_fontFiles => {
	for (const _font of _fontFiles) {
		// make a new pseudofont object.
		let _newFont = new PseudoFont(
			_font['fontName'],
			_font['fontLower'] || 'abcdefghijklmnopqrstuvwxyz',
			_font['fontUpper'] || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
			_font['fontDigits'] || '0123456789'
		);
		
		// add the font to the font list.
		fonts.push(_newFont);
		
		// add the font to the fonts selection list.
		let _newFontOption = document.createElement('option');
		_newFontOption.value = _newFont.fontName;
		_newFontOption.innerHTML = `${_newFont.fontName} (${_newFont.convert(_newFont.fontName)})`;
		e_fontSelect.appendChild(_newFontOption);
	}
	
	// enable the text area once the fonts have been loaded.
	e_inputTextArea.disabled = false;
	
	// show how many fonts are loaded inside parenthesis
	// e_viewAllConversions.innerText = `(${fonts.length})`;
	
	// select a random font to show at start.
	e_fontSelect.selectedIndex = Math.floor(Math.random() * fonts.length);
	
	// update all variables and convert the first text.
	updateUserInput();
	updateFontInput();
	convertText();
});

/* Event Listeners */
// Convert text on update of the text field.
e_inputTextArea.addEventListener('keyup', () => {
	updateUserInput(); 
	convertTextAll();
});

// Convert text when font is changed from the list.
e_fontSelect.addEventListener('change', () => {
	updateFontInput();
	convertText();
});

// Convert text when font style is changed from the list.
e_fontStyleSelect.addEventListener('change', () => {
	updateFontInput();
	updateUserInput();
	convertText();
});


// Enable/disable whether to convert all fonts or not.
e_viewall_container.addEventListener('click', () => {
	convertAll = (convertAll ? false : true);
	convertTextAll();
});

e_viewAllConversions.addEventListener('click', () => {
	convertAll = (convertAll ? false : true);
	convertTextAll();
});

// copy to clipboard btn
e_copytext.addEventListener('click', () => {
	let _range = document.createRange();
	window.getSelection().removeAllRanges();
	_range.selectNode(e_outputText);
	window.getSelection().addRange(_range);
	document.execCommand('copy');
	window.getSelection().removeAllRanges();
	
	// pop-up.
	swal({
		title: "Text Copied",
		icon: "success",
		buttons: false,
		timer: 1300,
	  });

});

// Copy content to clipboard if the user clicks on the converted text.
e_outputText.addEventListener('click', () => {
	let _range = document.createRange();
	window.getSelection().removeAllRanges();
	_range.selectNode(e_outputText);
	window.getSelection().addRange(_range);
	document.execCommand('copy');
	window.getSelection().removeAllRanges();
	
	// pop-up.
	swal({
		title: "Text Copied",
		icon: "success",
		buttons: false,
		timer: 1300,
	  });

});


/* Update Functions */
function updateUserInput() {
	let _userInput = e_inputTextArea.value;
	if (_userInput.trim()) {
		userInput = _userInput;
	} else {
		// generate a new random placeholder if the textarea has no value.
		updateRandomText();
		userInput = randomText;
	}
	
	switch (selectedStyle) {
		case "shift-upper":
			userInput = userInput.toUpperCase();
			break;
		case "shift-lower":
			userInput = userInput.toLowerCase();
			break;
		case "shift-alternate":
			userInput = userInput.toAlternateCase();;
			break;
		case "spaced":
			userInput = userInput.split('').join(' ');
			break;
		case "reverse":
			userInput = userInput.split('').reverse().join('');
			break;
	}
}

function updateFontInput() {
	// update the selected font and its style.
	selectedFont = fonts.find(fnt => fnt.fontName === e_fontSelect.value);
	selectedStyle = e_fontStyleSelect.value;
}

function updateRandomText() {
	// new random pun for placeholder.
	randomText = randomText[Math.floor(Math.random() * randomText.length)];
}

/* Conversion Functions */
function convertText() {
	// update the main font output.
	e_outputText.innerHTML = selectedFont.convert(userInput);
}

e_viewall_container.addEventListener('click', () => {
	convertTextAll();
})


function convertTextAll() {
	// update the main font output.
	convertText();
	
	if (convertAll) {
		// remove all children of the output list
		e_outputList.innerHTML = "";
		
		// convert the text and display all available fonts.
		for (const _font of fonts) {
			let _li = document.createElement("li");
			_li.innerHTML = `<p> <b class="unselectable">${_font.fontName}:</b> ${_font.convert(userInput)}</p>`;
			e_outputList.appendChild(_li);
		}
	}
}


// navigation bar
function navSlide() {
    const burger = document.querySelector(".burger");
    const nav = document.querySelector(".nav-links");
    const navLinks = document.querySelectorAll(".nav-links li");
    
    burger.addEventListener("click", () => {
        //Toggle Nav
        nav.classList.toggle("nav-active");
        
        //Animate Links
        navLinks.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = ""
            } else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.5}s`;
            }
        });
        //Burger Animation
        burger.classList.toggle("toggle");
    });
    
}

document.querySelectorAll('.nav-link').forEach(link => {
	if(link.href === window.location.href){
		link.setAttribute('aria-current', 'page')
	}
	})

navSlide();