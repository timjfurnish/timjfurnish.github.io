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
							if (fragment.isSpeech ? g_currentOptions.phrases.speech : g_currentOptions.phrases.narr)
							{
								Tally(count, fragment.text)
							}
						}
					}
				}
			}
		}

		var reply = []
		TableOpen(reply)
		TableAddHeading(reply, "Phrase")
		TableAddHeading(reply, "Times seen")
		var countWithoutSingletons = {}

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
			reply.push('<TD CLASS="cell">' + phrase + '&nbsp;' + CreateClickableText(kIconSearch, "SwitchToMentionsAndSearch(" + MakeParamsString(phrase) + ")") + '</TD><TD CLASS="cell">' + countWithoutSingletons[phrase] + '</TD>')
		}
		TableClose(reply)
		phrasesGoHere.innerHTML = reply.join('')
	}
}

TabDefine("phrases", function(reply, thenCall)
{
	var options = []
	OptionsMakeCheckbox(options, "PhrasesDisplay()", "speech", "Speech", true, true)
	OptionsMakeCheckbox(options, "PhrasesDisplay()", "narr", "Narrative", true, true)
	reply.push(OptionsConcat(options))
	MakeUpdatingArea(reply, "phrasesGoHere")
	thenCall.push(PhrasesDisplay)
}, {icon:kIconPhrase})