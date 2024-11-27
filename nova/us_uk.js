//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_usWords, g_ukWords
var g_internationalSubStrings =
[
	// o[u]r
	{us:"color",    uk:"colour"},
	{us:"avor",     uk:"avour"},
	{us:"humor",    uk:"humour"},
	
	// i[s/z]e
	{us:"ization",  uk:"isation",  check:izeCheck},
	{us:"ize",      uk:"ise",      check:izeCheck},
	{us:"izing",    uk:"ising",    check:izeCheck},
	
	// er/re
	{us:"theater",  uk:"theatre"},
	{us:"meter",    uk:"metre"},
	{us:"liter",    uk:"litre"},
	
	// misc.
	{us:"aluminum", uk:"aluminium"},
]

function izeCheck(before, match, after)
{
	return true
}

function DoInternationalTally(thisWord, thisCounter)
{
	if (! (thisWord in g_usWords))
	{
		g_usWords[thisWord] = {}
	}
	
	Tally(g_usWords[thisWord], thisCounter)
}

function CheckForMatch(wordIn, changeThis, intoThis, check)
{
	return wordIn.replaceAll(changeThis, intoThis)
}

function CheckForInternationalTally(word)
{
	if (word in g_usWords)
	{
		DoInternationalTally(word, "us")
	}
	else if (word in g_ukWords)
	{
		DoInternationalTally(g_ukWords[word], "uk")
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
//			NovaLog("Found " + word + " (uk=" + ukVersion + ", us=" + usVersion + ")")

			g_ukWords[ukVersion] = usVersion

			if (usVersion != word)
			{
				DoInternationalTally(usVersion, "uk")
			}
			
			if (ukVersion != word)
			{
				DoInternationalTally(usVersion, "us")
			}
		}
	}
}

OnEvent("clear", true, () =>
{
	g_usWords = {}
	g_ukWords = {}
})

TabDefine("international", function(reply, thenCall)
{
	TableOpen(reply)
	TableAddHeading(reply, "")
	TableAddHeading(reply, "UK")
	TableAddHeading(reply, "US")
	
	for (var [key, val] of Object.entries(g_ukWords))
	{		
		TableNewRow(reply)
		TableAddCell(reply, key + " / " + val)
		TableAddCell(reply, g_usWords[val].uk ?? '')
		TableAddCell(reply, g_usWords[val].us ?? '')
	}
	TableClose(reply)
}, {icon:kIconUSA, tooltipText:"UK vs. US"})