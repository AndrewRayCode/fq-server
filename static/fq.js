var keywords = {
	infection: {
		name: 'Infection',
		description: 'Infectious disease side effects of antibiotics',
	},
	staphylococcus: {
		name: 'Staphylococcus',
		description: 'Staphylococcus is a genus of Gram-positive bacteria. Under the microscope, they appear round, and form in grape-like clusters.',
	}
};

var studies = [{
	title: '“Collateral Damage” from Cephalosporin or Quinolone Antibiotic Therapy',
	includesFqs: false,
	keywords: [
		keywords.infection,
		keywords.staphylococcus
	],
	authors: [
		'David L. Paterson'
	],
	fullText: 'http://cid.oxfordjournals.org/content/38/Supplement_4/S341.full',
	abstract: 'Quinolone use has been linked to infection with methicillin-resistant Staphylococcus aureus and with increasing quinolone resistance in gram-negative bacilli, such as Pseudomonas aeruginosa. Neither third-generation cephalosporins nor quinolones appear suitable for sustained use in hospitals as “workhorse” antibiotic therapy.',
	conclusions: [
		'&hellip;cephalosporin and quinolone use has been linked more frequently to collateral damage (in the form of antibiotic-resistant superinfections)'
	],
	images: [{
		title: 'Table 1. Summary of potential “collateral damage” from use of cephalosporins and quinolones.',
		link: 'http://cid.oxfordjournals.org/content/38/Supplement_4/S341/F1.large.jpg'
	}]
}, {
	title: '',
	includesFqs: false,
	keywords: [
		keywords.infection,
		keywords.staphylococcus
	],
	authors: [
		''
	],
	fullText: '',
	abstract: '',
	conclusions: [
		''
	],
	images: [{
		title: '',
		link: ''
	}]
}, {
	title: '',
	includesFqs: false,
	keywords: [
		keywords.infection,
		keywords.staphylococcus
	],
	authors: [
		''
	],
	fullText: '',
	abstract: '',
	conclusions: [
		''
	],
	images: [{
		title: '',
		link: ''
	}]
}, {
	title: '',
	includesFqs: false,
	keywords: [
		keywords.infection,
		keywords.staphylococcus
	],
	authors: [
		''
	],
	fullText: '',
	abstract: '',
	conclusions: [
		''
	],
	images: [{
		title: '',
		link: ''
	}]
}];

function formatKeyword( keyword ) {
	return `
		${ keyword.name }
	`;
}

function formatStudy( study ) {
	return `<li class="study">
		<div class="title">${ study.title }</div>
		<ul class="subTitle">
			<li>
				<a href="${ study.fullText }" target="_blank">Full Text</a>
			</li>
			<li>
				<b>Authors:</b> ${ study.authors.join(', ') }
			</li>
		</ul>
		<p>
			<b>Abstract:</b> ${ study.abstract }
		</p>
		<p>
			<b>Conclusions:</b> ${ study.conclusions }
		</p>
		<p>
			<b>Keywords:</b> ${ study.keywords.map( kw => formatKeyword( kw ) ).join('') }
		</p>
	</li>`;
}

$(document).ready(function() {
	var $studies = $('#studies');

	$studies.html( studies.map( study => formatStudy( study ) ).join('\n') );
});
