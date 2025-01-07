//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2025
//==============================================

var g_usWords, g_ukWords, g_ignoredUSUKWords

const g_internationalSubStrings =
[
	// o[u]r
	{us:"color",    uk:"colour"},
	{us:"avor",     uk:"avour"},
	{us:"vior",     uk:"viour"},
	{us:"humor",    uk:"humour"},
	{us:"abor",     uk:"abour",     check:laboratoryCheck},
	{us:"ghbor",    uk:"ghbour"},

	// i[s/z]e
	{us:"ization",  uk:"isation",   check:izeCheck},
	{us:"ize",      uk:"ise",       check:izeCheck},
	{us:"izing",    uk:"ising",     check:izeCheck},

	// y[s/z]e
	{us:"yzation",  uk:"ysation"},
	{us:"yze",      uk:"yse",       check:(a,b,c)=>c!="lf"},
	{us:"yzing",    uk:"ysing"},

	// travelled/traveled etc.
	{us:"ele",      uk:"elle",      check:elCheck},
	{us:"eling",    uk:"elling",    check:elCheck},

	// er/re
	{us:"fiber",    uk:"fibre"},
	{us:"theater",  uk:"theatre"},
	{us:"meter",    uk:"metre",     check:meterCheck},
	{us:"liter",    uk:"litre",		check:notANextCheck},

	// ence vs. ense
	{us:"ense",     uk:"ence",      check:enceCheck},
	{us:"ensing",   uk:"encing",    check:enceCheck},

	// misc.
	{us:"aluminum",    uk:"aluminium"},
	{us:"maneuver",    uk:"manoeuvre",     check:(a,b,c)=>c==""},
	{us:"maneuvering", uk:"manoeuvring"},
	{us:"maneuvered",  uk:"manoeuvred"},
	{us:"artifact",    uk:"artefact"},
	{us:"cozy",        uk:"cosy"},
	{us:"coziness",    uk:"cosiness"},
	{us:"gray",        uk:"grey"},
	{us:"plow",        uk:"plough"},
	{us:"skeptic",     uk:"sceptic"},
	{us:"sulfur",      uk:"sulphur"},
]

function laboratoryCheck(before, match, after)
{
	if (after.startsWith('ator'))
	{
		return false
	}

	return true
}

function elCheck(before, match, after)
{
	if (before.endsWith('e') || before.endsWith('u') || before.endsWith('w') || before.endsWith('h') || before.endsWith('s') || before.endsWith('sm') || before.endsWith('sp') || before.endsWith('yt') || before.endsWith('-t') || before.endsWith('ret') || before.length == 1)
	{
		// Ignore kneeled, fueled, dweller, shelling etc.
		return false
	}

	if (match.endsWith('e'))
	{
		if ((before.endsWith('dec') || before.endsWith('acc')) && after.startsWith('rat'))
		{
			// Ignore acceleration, decelerate etc.
			return false
		}

		if (! (after.startsWith('r') || after.startsWith('d')))
		{
			return false
		}
	}

	return true
}

function enceCheck(before, match, after)
{
	if (before.length == 1)
	{
		return false
	}

	if (before.endsWith('f') || before.endsWith('ic') || before.endsWith('pret'))
	{
		return true
	}

	return false
}

function izeCheck(before, match, after)
{
	if (after.startsWith('l') || after.startsWith('n') || after.startsWith('enuous') || after.startsWith('cond'))
	{
		// Ignore chisel, citizen, denizen, disengage, disingenuousness, millisecond etc.
		return false
	}

	if (before.endsWith('vert'))
	{
		// Ignore advertising (but allow advertize)
		if (match == 'ising' || after.startsWith('ment'))
		{
			return false
		}
	}

	if (before.endsWith('w') || before.endsWith('v'))
	{
		// Ignore clockwise, wizened, unwisely, wiser, advise, improvise, revising etc.
		return false
	}

	if (before.endsWith('ec') || before.endsWith('rc') || before.endsWith('nc') || before.endsWith('nch'))
	{
		// Ignore precise, exercise, concise, crises, franchise etc.
		return false
	}

	if (before.endsWith('s') || before.endsWith('st'))
	{
		// Ignore size, resizing, chastise etc.
		return false
	}

	if (before.endsWith('ct') || before.endsWith('treat'))
	{
		// Ignore practise, treatise etc.
		return false
	}

	if (before.endsWith('p') || before.endsWith('pr') || before.endsWith('pert'))
	{
		// Ignore despise, prize, prise, unsurprisingly, expertise etc.
		return false
	}

	if (before.endsWith('a') || before.endsWith('e') || before.endsWith('o') || before.endsWith('u'))
	{
		// Ignore noise, poise, raise, disguise, bruise, seize etc.
		return false
	}

	if (before.endsWith('m'))
	{
		if (! before.endsWith('tim') && ! before.endsWith('nim') && ! before.endsWith('xim'))
		{
			// Ignore miserable, compromise, premises etc. (but allow optimize/optimise, minimize/minimise, maximize/maximise)
			return false
		}
	}

	if (before == 'ar' || before == 'ir' || before == 'pen' || before.length == 1 || before.endsWith('nr'))
	{
		// Ignore arise, irises, misery, disengage, rise, sunrise etc. (but allow plagiarise/plagiarize etc.)
		return false
	}

	return true
}

function notANextCheck(before, match, after)
{
	return !after.startsWith('a')
}

function meterCheck(before, match, after)
{
	if (before.endsWith('centi') || before.endsWith('deca') || before.endsWith('deci') || before.endsWith('deka') || before.endsWith('hecto') || before.endsWith('kilo') || before.endsWith('micro') || before.endsWith('milli') || before.endsWith('mis') || before.endsWith('nano') || before.endsWith('pico'))
	{
		return true
	}

	if (before.endsWith('-') && !before.endsWith('-o-'))
	{
		return true
	}

	return false
}

function DoInternationalTally(thisWord, thisCounter, deets)
{
	if (! (thisWord in g_usWords))
	{
		g_usWords[thisWord] = {}
	}

	Tally(g_usWords[thisWord], thisCounter, deets.inSpeech + deets.inNarrative)
}

function CheckForMatch(wordIn, changeThis, intoThis, check)
{
	if (wordIn.indexOf(changeThis) < 0)
	{
		return wordIn
	}

	var brokenIntoBits = wordIn.split(changeThis)

	if (! check)
	{
		return brokenIntoBits.join(intoThis)
	}

	var results = brokenIntoBits.shift()
	var nextBit = brokenIntoBits.shift()

	while (nextBit !== undefined)
	{
		if (check(results, changeThis, nextBit))
		{
			results += intoThis
		}
		else
		{
			results += changeThis
		}
	
		results += nextBit
		nextBit = brokenIntoBits.shift()
	}

	if (results == wordIn)
	{
		g_ignoredUSUKWords[wordIn] = true
	}
	return results
}

function CheckForInternationalTally()
{
	for (const word of Object.keys(g_checkedWords))
	{
		if (word in g_usWords)
		{
			DoInternationalTally(word, "us", g_checkedWords[word])
		}
		else if (word in g_ukWords)
		{
			DoInternationalTally(g_ukWords[word], "uk", g_checkedWords[word])
		}
		else
		{
			var ukVersion = word
			var usVersion = word

			for (const {us, uk, check} of g_internationalSubStrings)
			{
				ukVersion = CheckForMatch(ukVersion, us, uk, check)
				usVersion = CheckForMatch(usVersion, uk, us, check)
			}

			if (usVersion != ukVersion)
			{
				const deets = g_checkedWords[word]
				g_ukWords[ukVersion] = usVersion

				if (usVersion != word)
				{
					DoInternationalTally(usVersion, "uk", deets)
				}

				if (ukVersion != word)
				{
					DoInternationalTally(usVersion, "us", deets)
				}
			}
		}
	}
}

OnEvent("clear", true, () =>
{
	g_usWords = {}
	g_ukWords = {}
	g_ignoredUSUKWords = {}
})

OnEvent("processingDone", true, () =>
{
	var count = 0

	CheckForInternationalTally()
	for (var {us, uk} of Object.values(g_usWords))
	{
		if (us && uk)
		{
			++ count
		}
	}
	SetTabTitle('international', count || undefined)
})

TabDefine("international", function(reply, thenCall)
{
	TableOpen(reply)
	TableAddHeading(reply, "")
	TableAddHeading(reply, "UK")
	TableAddHeading(reply, "US")

	for (var key of Object.keys(g_ukWords).sort())
	{
		const val = g_ukWords[key]
		TableNewRow(reply)
		TableAddCell(reply, key + " / " + val + " " + CreateClickableText(kIconSearch, "SwitchToMentionsAndSearch(" + MakeParamsString(key + '|' + val) + ")"))
		TableAddCell(reply, g_usWords[val].uk ?? '')
		TableAddCell(reply, g_usWords[val].us ?? '')
	}
	
	TableClose(reply)
}, {icon:kIconUSA, canSelect:true, tooltipText:"UK vs. US"})