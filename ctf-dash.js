$(document).ready(function(){
	$('#input-text').on('keyup', function() {
		const text = $("#input-text").val();
		updateInputs(text);
	});
});

function updateInputs(text){
	// split the input up into items
	const inp = text.split(/( +|,+)/).filter(function (el) {
		return (el !== " " && el !== ",");
	});

	// convert items to different bases and then to ASCII (actually UTF-16)
	const bin = inp.map(function(x) { return parseInt(x, 2); });
	const oct = inp.map(function(x) { return parseInt(x, 8); });
	const dec = inp.map(function(x) { return parseInt(x, 10); });
	const hex = inp.map(function(x) { return parseInt(x, 16); });
	$('#bin-ascii').val(String.fromCharCode.apply(String, bin).split(""));
	$('#oct-ascii').val(String.fromCharCode.apply(String, oct).split(""));
	$('#dec-ascii').val(String.fromCharCode.apply(String, dec).split(""));
	$('#hex-ascii').val(String.fromCharCode.apply(String, hex).split(""));

	// convert items from ASCII (actually UTF-16) to different bases
	const bin2 = inp.map(function (x) { return x.charCodeAt(0).toString(2) });
	const oct2 = inp.map(function (x) { return x.charCodeAt(0).toString(8) });
	const dec2 = inp.map(function (x) { return x.charCodeAt(0) });
	const hex2 = inp.map(function (x) { return x.charCodeAt(0).toString(16) });
	$('#ascii-bin').val(bin2);
	$('#ascii-oct').val(oct2);
	$('#ascii-dec').val(dec2);
	$('#ascii-hex').val(hex2);

	// conversions between number bases - binary
	const bin3 = inp.map(function (x) { return parseInt(x,2).toString(2) });
	const oct3 = inp.map(function (x) { return parseInt(x,2).toString(8) });
	const dec3 = inp.map(function (x) { return parseInt(x,2) });
	const hex3 = inp.map(function (x) { return parseInt(x,2).toString(16) });

	$('#bin-bin').val(bin3);
	$('#bin-oct').val(oct3);
	$('#bin-dec').val(dec3);
	$('#bin-hex').val(hex3);

	// conversions between number bases - octal
	const bin4 = inp.map(function (x) { return parseInt(x,8).toString(2) });
	const oct4 = inp.map(function (x) { return parseInt(x,8).toString(8) });
	const dec4 = inp.map(function (x) { return parseInt(x,8) });
	const hex4 = inp.map(function (x) { return parseInt(x,8).toString(16) });

	$('#oct-bin').val(bin4);
	$('#oct-oct').val(oct4);
	$('#oct-dec').val(dec4);
	$('#oct-hex').val(hex4);

	// conversions between number bases - decimal
	const bin5 = inp.map(function (x) { return parseInt(x,10).toString(2) });
	const oct5 = inp.map(function (x) { return parseInt(x,10).toString(8) });
	const dec5 = inp.map(function (x) { return parseInt(x,10) });
	const hex5 = inp.map(function (x) { return parseInt(x,10).toString(16) });

	$('#dec-bin').val(bin5);
	$('#dec-oct').val(oct5);
	$('#dec-dec').val(dec5);
	$('#dec-hex').val(hex5);

	// conversions between number bases - hexadecimal
	const bin6 = inp.map(function (x) { return parseInt(x,16).toString(2) });
	const oct6 = inp.map(function (x) { return parseInt(x,16).toString(8) });
	const dec6 = inp.map(function (x) { return parseInt(x,16) });
	const hex6 = inp.map(function (x) { return parseInt(x,16).toString(16) });

	$('#hex-bin').val(bin6);
	$('#hex-oct').val(oct6);
	$('#hex-dec').val(dec6);
	$('#hex-hex').val(hex6);

	// convert numbers to the corresponding letters (mod 26)
	const letter = dec.map(function(x) { return String.fromCharCode((((x-1)%26)+1)+64)});
	$('#dec-letter').val(letter);
}
