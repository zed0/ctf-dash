$(document).ready(function(){
	$('#input-text').on('keyup', function() {
		const text = $("#input-text").val();
		updateInputs(text);
	});
});

function fromBaseTransform(base, baseName) {
	const digits = _.take(['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'], base);

	return {
		name: `From ${baseName}`,
		validity: input => input !== '' && _.every(_.toUpper(input), c => _.includes(digits, c)),
		transform: input => parseInt(input, base).toString(),
	};
}

function toBaseTransform(base, baseName) {
	const digits = ['0','1','2','3','4','5','6','7','8','9'];
	return {
		name: `To ${baseName}`,
		validity: input => input !== '' && _.every(input, c => _.includes(digits, c)),
		transform: input => parseInt(input, 10).toString(base),
	}
}

const braille = {
	' ': '⠀', '_': '⠸', '-': '⠤', ',': '⠠', ';': '⠰', ':': '⠱', '!': '⠮', '?': '⠹', '.': '⠨', '(': '⠷', '[': '⠪', '@': '⠈', '*': '⠡', '/': '⠌', '\'': '⠄', '\"': '⠐', '\\': '⠳', '&': '⠯', '%': '⠩', '^': '⠘', '+': '⠬', '<': '⠣', '>': '⠜', '$': '⠫',
	'0': '⠴', '1': '⠂', '2': '⠆', '3': '⠒', '4': '⠲', '5': '⠢', '6': '⠖', '7': '⠶', '8': '⠦', '9': '⠔',
	'A': '⠁', 'B': '⠃', 'C': '⠉', 'D': '⠙', 'E': '⠑', 'F': '⠋', 'G': '⠛', 'H': '⠓', 'I': '⠊', 'J': '⠚', 'K': '⠅', 'L': '⠇', 'M': '⠍', 'N': '⠝', 'O': '⠕', 'P': '⠏', 'Q': '⠟', 'R': '⠗', 'S': '⠎', 'T': '⠞', 'U': '⠥', 'V': '⠧', 'W': '⠺', 'X': '⠭', 'Z': '⠵',
	']': '⠻', '#': '⠼', 'Y': '⠽', ')': '⠾', '=': '⠿'
};

const transforms = [
	fromBaseTransform(2,  'binary'),
	fromBaseTransform(8,  'octal'),
	fromBaseTransform(16, 'hex'),
	toBaseTransform(2,  'binary'),
	toBaseTransform(8,  'octal'),
	toBaseTransform(16, 'hex'),
	{
		name: 'ASCII values',
		validity: input => input !== '',
		transform: input => _.map(input, c => c.charCodeAt(0).toString()).join(' '),
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
		validity: input => input !== '' && _.every(input, c => braille[c.toUpperCase()] !== undefined),
		transform: input => {
			return _(input)
				.map(c => braille[c.toUpperCase()])
				.join('');
		},
	},
];

const maxDepth = 3;
function runTransforms(input, depth=0) {
	const results = [];

	if(depth >= maxDepth)
		return results;

	for(const transform of transforms) {
		if(!transform.validity(input))
			continue;

		const nextInput = transform.transform(input);

		const childResults = runTransforms(nextInput, depth + 1);
		results.push({operation: transform.name, result: nextInput, children: childResults});
	}

	return results;
}

const generateHtml = _.template(`
	<form>
		<div class="form-group row">
			<label class="col-sm-2 col-form-label" for="input-<%- id %>"><%- chain %></label>
			<div class="col-sm-10">
				<input type="text" class="form-control" id="input-<%- id%>" readonly value="<%= result %>">
			</div>
		</div>
		<div class="children" style="margin-left: 20px;">
		</div>
	</form>
`);

function displayResults(parentElement, results) {
	let id = 0;

	for(let result of results) {
		const resultHtml = generateHtml({
			id: id++,
			chain: result.operation,
			result: result.result,
		});
		const resultElement = $(resultHtml).appendTo(parentElement);

		const childResultsArea = resultElement.find('.children');
		displayResults(childResultsArea, result.children);
	}
}

function updateInputs(text) {
	const input = text;

	const results = runTransforms(input);

	const resultsArea = $('#result-area');
	resultsArea.empty();

	displayResults(resultsArea, results);
}
