//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_usWords, g_ukWords
var g_internationalSubStrings = ["color|colour", "avor|avour", "ization|isation", "ize|ise", "izing|ising", "aluminum|aluminium"]

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

			if (word.includes(us))
			{
				DoInternationalTally(word, "us")
			}
			else
			{
				const usVersion = word.replace(uk, us)
				
				if (usVersion != word)
				{
					g_ukWords[word] = usVersion
					DoInternationalTally(usVersion, "uk")
				}
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
//	TabBuildButtonsBar(reply, Object.keys(kSettingNames))

	TableOpen(reply)
	TableClose(reply)
}, "US_UK")