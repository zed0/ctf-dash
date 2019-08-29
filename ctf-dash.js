// Tracking changes via this rather than on change because change only fires when the input is blurred
let previousInput = null;
$(document).ready(function(){
	$('#input-text').on('keyup', function() {
		const text = $("#input-text").val();
		if(previousInput !== text) {
			previousInput = text;
			updateInputs(text);
		}
	});
});

const braille = {
	' ': '⠀', '_': '⠸', '-': '⠤', ',': '⠠', ';': '⠰', ':': '⠱', '!': '⠮', '?': '⠹', '.': '⠨', '(': '⠷', '[': '⠪', '@': '⠈', '*': '⠡', '/': '⠌', '\'': '⠄', '\"': '⠐', '\\': '⠳', '&': '⠯', '%': '⠩', '^': '⠘', '+': '⠬', '<': '⠣', '>': '⠜', '$': '⠫',
	'0': '⠴', '1': '⠂', '2': '⠆', '3': '⠒', '4': '⠲', '5': '⠢', '6': '⠖', '7': '⠶', '8': '⠦', '9': '⠔',
	'A': '⠁', 'B': '⠃', 'C': '⠉', 'D': '⠙', 'E': '⠑', 'F': '⠋', 'G': '⠛', 'H': '⠓', 'I': '⠊', 'J': '⠚', 'K': '⠅', 'L': '⠇', 'M': '⠍', 'N': '⠝', 'O': '⠕', 'P': '⠏', 'Q': '⠟', 'R': '⠗', 'S': '⠎', 'T': '⠞', 'U': '⠥', 'V': '⠧', 'W': '⠺', 'X': '⠭', 'Z': '⠵',
	']': '⠻', '#': '⠼', 'Y': '⠽', ')': '⠾', '=': '⠿'
};

const hexDigits = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'];

function fromBaseTransform(base, baseName) {
	const digitsForBase = _.take(hexDigits, base);

	return {
		name: `From ${baseName}`,
		validity: input => _(input)
			.split(' ')
			.every(s => s !== '' && _.every(_.toUpper(s), c => _.includes(digitsForBase, c)) && parseInt(s, base) <= Number.MAX_SAFE_INTEGER),
		transform: input => _(input)
			.split(' ')
			.map(s => parseInt(s, base).toString())
			.join(' '),
	};
}

function toBaseTransform(base, baseName) {
	const digitsForDecimal = _.take(hexDigits, 10);
	return {
		name: `To ${baseName}`,
		validity: input => _(input)
			.split(' ')
			.every(s => s !== '' && _.every(s, c => _.includes(digitsForDecimal, c)) && parseInt(s, 10) <= Number.MAX_SAFE_INTEGER),
		transform: input => _(input)
			.split(' ')
			.map(s => parseInt(s, 10).toString(base))
			.join(' '),
	};
}

function groupAsN(n) {
	return {
		name: `Group as ${n}`,
		validity: input => input !== '' && input.length % n === 0 && !_.includes(input, ' '),
		transform: input => {
			return _(input)
				.chunk(n)
				.map(s => s.join(''))
				.join(' ');
		},
	};
}

function padToMultiple(n) {
	return {
		// Currently only padding numbers, not sure what to pad other strings with
		name: `Pad front mod ${n}`,
		validity: input => input !== '' && input.length % n !== 0 && _.every(_.toUpper(input), c => _.includes(hexDigits, c)),
		transform: input => '0'.repeat(n - (input.length % n)) + input,
	};
}

function padGroups(n) {
	return {
		// Currently only padding numbers, not sure what to pad other strings with
		name: `Pad groups mod ${n}`,
		validity: input => input !== '' && _.includes(input, ' ') && _(input)
			.split(' ')
			.every(s => s.length <= n && _.every(_.toUpper(s), c => _.includes(hexDigits, c))),
		transform: input => _(input)
			.split(' ')
			.map(s => _.padStart(s, n, '0'))
			.join(' '),
	};
}

const transforms = [
	fromBaseTransform(2,  'binary'),
	fromBaseTransform(8,  'octal'),
	fromBaseTransform(16, 'hex'),
	toBaseTransform(2,  'binary'),
	toBaseTransform(8,  'octal'),
	toBaseTransform(16, 'hex'),
	padToMultiple(8),
	padGroups(8),
	groupAsN(8),
	{
		name: 'ASCII values',
		validity: input => input !== '',
		transform: input => _.map(input, c => c.charCodeAt(0).toString()).join(' '),
	},
	{
		name: 'As ASCII',
		validity: input => _(input)
			.split(' ')
			.every(c => parseInt(c, 10) < 256),
		transform: input => _(input)
			.split(' ')
			.map(c => String.fromCharCode(parseInt(c, 10)))
			.join(''),
	},
	{
		name: 'Strip spaces',
		// NOTE: We specifically include a blank braille, which doesn't technically count as whitespace
		// https://en.wikipedia.org/wiki/Trimming_(computer_programming)#Non-space_blanks
		validity: input => /[\s⠀]/.test(input),
		transform: input => _.replace(input, /[\s⠀]/g,''),
	},
	{
		name: 'Index alphabet',
		validity: input => _(input)
			.split(' ')
			.map(n => parseInt(n, 10))
			.every(n => (n <= 26 && n > 0)),
		transform: input => _(input)
			.split(' ')
			.map(n => parseInt(n, 10))
			.map(n => String.fromCharCode('a'.charCodeAt(0) - 1 + n))
			.join(''),
	},
	{
		name: 'To braile',
		displayClasses: 'braille',
		validity: input => input !== '' && _.some(input, c => braille[c.toUpperCase()] !== undefined),
		transform: input => {
			return _(input)
				.map(c => braille[c.toUpperCase()] !== undefined ? braille[c.toUpperCase()] : c)
				.join('');
		},
	},
];

const maxDepth = 4;
function runTransforms(input, parentResults, depth=0) {
	const results = [];

	if(depth >= maxDepth)
		return results;

	for(const transform of transforms) {
		if(!transform.validity(input))
			continue;

		const nextInput = transform.transform(input);
		if(_.includes(parentResults, nextInput))
			continue;

		const childResults = runTransforms(nextInput, [...parentResults, nextInput], depth + 1);
		results.push({
			operation: transform.name,
			result: nextInput,
			children: childResults,
			displayClasses: transform.displayClasses,
		});
	}

	return results;
}

const generateHtml = _.template(`
	<form>
		<div class="form-group row <%- extraClasses %>">
			<label
				class="col-sm-2 col-form-label"
				for="<%- id %>-input"
			>
				<a href="#<%- id %>-children" data-toggle="collapse"></a>
				<%- chain %>
			</label>
			<div class="col-sm-10">
				<textarea class="form-control result-output" id="<%- id %>-input" readonly rows="1"><%= result %></textarea>
			</div>
		</div>
		<div
			id="<%- id %>-children"
			class="children collapse show"
			style="margin-left: 20px;"
		>
		</div>
	</form>
`);

function displayResults(parentElement, parentId, results) {
	let idNum = 0;

	for(let result of results) {
		const id = `${parentId}-${idNum++}`;
		const resultHtml = generateHtml({
			id,
			chain: result.operation,
			result: result.result,
			extraClasses: result.displayClasses,
		});
		const resultElement = $(resultHtml).appendTo(parentElement);

		const childResultsArea = resultElement.find('.children');
		displayResults(childResultsArea, id, result.children);
	}
}

function updateInputs(text) {
	const input = text;

	const results = runTransforms(input, [input]);

	const resultsArea = $('#result-area');
	resultsArea.empty();

	displayResults(resultsArea, 'root', results);
}
