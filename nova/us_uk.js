//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_usWords, g_ukWords
var g_internationalSubStrings = ["color|colour", "avor|avour", "ization|isation", "ize|ise", "izing|ising", "aluminum|aluminium", "humor|humour", "theater|theatre", "meter|metre", "liter|litre"]

function DoInternationalTally(thisWord, thisCounter)
{
	if (! (thisWord in g_usWords))
	{
		g_usWords[thisWord] = {}
	}
	
	Tally(g_usWords[thisWord], thisCounter)
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
		for (var aPair of g_internationalSubStrings)
		{
			const [us, uk] = aPair.split('|', 2)

			const ukVersion = word.replaceAll(us, uk)
			
			if (ukVersion != word)
			{
				g_ukWords[ukVersion] = word
				DoInternationalTally(word, "us")
			}
			
			const usVersion = word.replaceAll(uk, us)
			
			if (usVersion != word)
			{
				g_ukWords[word] = usVersion
				DoInternationalTally(usVersion, "uk")
			}
		}
	}
}

OnEvent("clear", true, () =>
{
	g_usWords = {}
	g_ukWords = {}
})

/*
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
		TableAddCell(reply, g_usWords[val].uk)
		TableAddCell(reply, g_usWords[val].us)
	}
	TableClose(reply)
}, {icon:kIconUSA, tooltipText:"UK vs. US"})
*/