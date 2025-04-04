//==============================================
// Part of Nova - NOVel Assistant
// (c) Tim Furnish, 2023-2025
//==============================================

function PhrasesDisplay()
{
	var phrasesGoHere = document.getElementById("phrasesGoHere")
	if (phrasesGoHere)
	{
		var count = {}

		for (var metadata of g_metaDataInOrder)
		{
			for (var para of metadata.myParagraphs)
			{
				if (! para.ignoreFragments)
				{
					for (var fragment of para.fragments)
					{
						if (! fragment.heading && fragment.text.includes(" "))
						{
							if (fragment.isSpeech ? g_currentOptions.counters.speech : g_currentOptions.counters.narr)
							{
								Tally(count, fragment.text)
							}
						}
					}
				}
			}
		}

		var reply = []
		var countWithoutSingletons = {}

		TableOpen(reply)
		TableAddHeading(reply, "Phrase")
		TableAddHeading(reply, "Times seen")

		for (var [phrase, num] of Object.entries(count))
		{
			if (num > 1)
			{
				countWithoutSingletons[phrase] = num
			}
		}

		for (var phrase of Object.keys(countWithoutSingletons).sort((p1, p2) => (countWithoutSingletons[p2] - countWithoutSingletons[p1])))
		{
			TableNewRow(reply)
			reply.push('<TD CLASS="cell">' + phrase + '&nbsp;' + CreateClickableText(kIconSearch, "SwitchToMentionsAndSearch(" + MakeParamsString(phrase) + ", 'Phrase equals')") + '</TD><TD CLASS="cell">' + countWithoutSingletons[phrase] + '</TD>')
		}

		TableClose(reply)
		phrasesGoHere.innerHTML = reply.join('')
	}
}

function Counter_Phrases(reply, thenCall)
{
	var options = []
	OptionsMakeCheckbox(options, "PhrasesDisplay()", "speech", "Speech", true)
	OptionsMakeCheckbox(options, "PhrasesDisplay()", "narr", "Narrative", true)
	reply.push(OptionsConcat(options))
	reply.push("<BR>")
	MakeUpdatingArea(reply, "phrasesGoHere")
	thenCall.push(PhrasesDisplay)
}