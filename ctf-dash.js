// Tracking changes via this rather than on change because change only fires when the input is blurred
let previousInput = null;
$(document).ready(function(){
	const debouncedUpdate = _.debounce(updateInputs, 250);
	$('#input-text').on('keyup', function() {
		const text = $("#input-text").val();
		if(previousInput !== text) {
			previousInput = text;
			debouncedUpdate(text);
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

const usStates = {
	AL: 'Alabama',
	AK: 'Alaska',
	AZ: 'Arizona',
	AR: 'Arkansas',
	CA: 'California',
	CO: 'Colorado',
	CT: 'Connecticut',
	DE: 'Delaware',
	FL: 'Florida',
	GA: 'Georgia',
	HI: 'Hawaii',
	ID: 'Idaho',
	IL: 'Illinois',
	IN: 'Indiana',
	IA: 'Iowa',
	KS: 'Kansas',
	KY: 'Kentucky',
	LA: 'Louisiana',
	ME: 'Maine',
	MD: 'Maryland',
	MA: 'Massachusetts',
	MI: 'Michigan',
	MN: 'Minnesota',
	MS: 'Mississippi',
	MO: 'Missouri',
	MT: 'Montana',
	NE: 'Nebraska',
	NV: 'Nevada',
	NH: 'New Hampshire',
	NJ: 'New Jersey',
	NM: 'New Mexico',
	NY: 'New York',
	NC: 'North Carolina',
	ND: 'North Dakota',
	OH: 'Ohio',
	OK: 'Oklahoma',
	OR: 'Oregon',
	PA: 'Pennsylvania',
	RI: 'Rhode Island',
	SC: 'South Carolina',
	SD: 'South Dakota',
	TN: 'Tennessee',
	TX: 'Texas',
	UT: 'Utah',
	VT: 'Vermont',
	VA: 'Virginia',
	WA: 'Washington',
	WV: 'West Virginia',
	WI: 'Wisconsin',
	WY: 'Wyoming',
};

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
			const withoutSpaces = _.replace(input, /[\s⠀]/g,'');
			return _(withoutSpaces)
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
	groupAsN(2),
	{
		name: 'ASCII values',
		validity: input => input !== '',
		transform: input => _.map(input, c => c.charCodeAt(0).toString()).join(' '),
	},
	{
		name: 'As ASCII',
		validity: input => _(input)
			.split(' ')
			.every(s => s !== '' && _.every(s, c => _.includes(_.take(hexDigits, 10), c)) && parseInt(s, 10) <= 256),
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
			.every(s => s !== '' && _.every(s, c => _.includes(_.take(hexDigits, 10), c)) && parseInt(s, 10) > 0 && parseInt(s, 10) <= 26),
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
	{
		name: 'To US State',
		validity: input => input !== '' && _(input)
			.split(' ')
			.every(s => usStates[s.toUpperCase()] !== undefined),
		transform: input => _(input)
			.split(' ')
			.map(s => usStates[s.toUpperCase()])
			.join(' '),
	},
];

const checkers = [
	{
		name: 'Dictionary word',
		check: input => {
			return _.includes(dictionaryWords, input);
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
		const likely = _.some(checkers, checker => checker.check(nextInput));
		const childLikely = _.sumBy(childResults, child => child.likelyTotal);
		results.push({
			operation: transform.name,
			result: nextInput,
			children: childResults,
			displayClasses: transform.displayClasses,
			likely: likely,
			likelyTotal: (childLikely * 0.1) + likely, // Reduce likelihood of children to promote top level answers
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
				<textarea class="form-control result-output <%= likely ? 'is-valid' : '' %>" id="<%- id %>-input" readonly rows="1"><%= result %></textarea>
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
			extraClasses: `${result.displayClasses ? result.displayClasses : ''}`,
			likely: result.likely,
		});
		const resultElement = $(resultHtml).appendTo(parentElement);

		const childResultsArea = resultElement.find('.children');
		displayResults(childResultsArea, id, result.children);
	}
}

function sortResults(results) {
	const sortedResults = _.sortBy(results, result => -result.likelyTotal);
	for(const result of sortedResults) {
		result.children = sortResults(result.children);
	}
	return sortedResults;
}

function updateInputs(text) {
	const input = text;

	const results = runTransforms(input, [input]);

	const resultsArea = $('#result-area');
	resultsArea.empty();

	const sortedResults = sortResults(results);
	displayResults(resultsArea, 'root', sortedResults);
}
