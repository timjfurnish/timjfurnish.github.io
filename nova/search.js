//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2025
//==============================================

var g_threadSections = []
var g_searchDataForGraph = {colours:{}, data:{}}
var g_threadSectionSelected = 0
var g_recentlyHighlightedReadToMeText = []

const kIndent = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"

function TurnRedIf(input, condition)
{
	return condition ? "<FONT COLOR=Red>" + input + "</FONT>" : input
}

function RedrawSearchResults()
{
	var searchResultsHere = document.getElementById("searchResultsHere")
	var customTextBox = document.getElementById("search.custom")
	
	if (searchResultsHere && customTextBox)
	{
		var displayThis = "<center><B>No results found</B></center>"
		var graphVisible = false
		var entityNames = document.getElementById("search.entity")?.value

		g_searchDataForGraph = {colours:{}, data:[], doStripes:true}

		if (entityNames)
		{
			customTextBox.value = entityNames
			customTextBox.readOnly = true
		}
		else
		{
			entityNames = customTextBox.value
			customTextBox.readOnly = false
		}

		const {page, colourUsing} = g_currentOptions.search
		const showThis = g_currentOptions.search["showThis_" + page]
		const gapValue = +g_currentOptions.search["smoothing_" + page] * 4 + 2
		const bgData = g_metaDataSeenValues[colourUsing]

//		NovaLog("Searching for '" + entityNames + "' in sections where " + page + "='" + showThis + "'")

		if (bgData)
		{
			g_searchDataForGraph.backgroundBlocks = []
		}

		if (entityNames && g_metaDataInOrder.length)
		{
			var output = []
			var grabEmHere = {}

			const theString = "\\b(?:" + TurnNovaShorthandIntoRegex(entityNames) + ")\\b"
			const exp = new RegExp(theString, "ig");

			for (var metadata of g_metaDataInOrder)
			{
				const info = metadata.info

				if (((page == "ALL") || ((page == "MENTIONS") ? metadata.Mentions[showThis] : (info[page] == showThis))))
				{
					GraphAddBackgroundBlock(g_searchDataForGraph, metadata.Paragraphs, info[colourUsing])
					
					var addAfterSkippedLines = "<H3>" + MetaDataMakeFragmentDescription(metadata) + "</H3>"
					var keepShowingCountdown = 0
					var showThisToo = null
					var skippedLines = true

					for (var para of metadata.myParagraphs)
					{
						if (! para.ignoreFragments)
						{
							function GotAMatch(matched)
							{
								const upper = matched.toUpperCase()
								Tally(grabEmHere, upper)
								Tally(grabForPara, upper)
								return Highlighter(matched, undefined, 'highlightFor="' + upper + '"')
							}

							var grabForPara = {}
							var s2 = para.allOfIt.replace(exp, GotAMatch)
							const foundTextHere = (para.allOfIt != s2)
							var allowedToAdd = true

							g_searchDataForGraph.data.push(grabForPara)

							if (foundTextHere || keepShowingCountdown)
							{
								var before = ""
								if (foundTextHere)
								{
									keepShowingCountdown = 1
								}
								else
								{
									-- keepShowingCountdown
								}

								if (skippedLines)
								{
									before = addAfterSkippedLines
									skippedLines = false
									addAfterSkippedLines = "<br>"
								}
								if (showThisToo)
								{
									output.push(before + kIndent + showThisToo)
									before = ""
								}
								output.push(before + kIndent + TurnRedIf(s2, para.issues))
								showThisToo = null
							}
							else
							{
								if (showThisToo)
								{
									skippedLines = true
								}
								showThisToo = s2
							}
						}
						else
						{
							keepShowingCountdown = 0
							showThisToo = null
							skippedLines = true
						}
					}
				}
			}

			if (output.length)
			{
				const upperKeys = Object.keys(grabEmHere)
				const colours = MakeColourLookUpTable(upperKeys, 0.3, PickColourOffsetForString(entityNames))

				var realOutput = []
				var recolour = []

				g_searchDataForGraph.colours = colours

				for (var key of upperKeys)
				{
					recolour.push(['highlightFor="' + key + '"', 'style="background-color:' + g_searchDataForGraph.colours[key] + '"'])
				}

				for (var eachLine of output)
				{
					for (var [searchFor, becomes] of recolour)
					{
						eachLine = eachLine.replaceAll(searchFor, becomes)
					}
					realOutput.push(eachLine)
				}

				displayThis = "<center>" + TableShowTally(grabEmHere, {ignoreWhenThisLow:1, addSearchIcon:true, colours:g_searchDataForGraph.colours, showTotal:true}) + "</center>" + realOutput.join('<BR>')
				graphVisible = true
			}
		}
		
		searchResultsHere.innerHTML = displayThis

		const graphShowHide = document.getElementById("graphShowHide")
		if (graphShowHide)
		{
			if (graphVisible)
			{
				graphShowHide.style.display = "block"
				DrawSmoothedGraph(g_searchDataForGraph)
			}
			else
			{
				graphShowHide.style.display = "none"
			}
		}
	}
}

function SettingsGetMentionList(firstElementText, useNameAsKey)
{
	const specificNames = SettingsGetNamesArrays()
	var nameData = {}
	
	if (firstElementText)
	{
		nameData[""] = firstElementText
	}
	
	for (var name of specificNames)
	{
		const value = name.arr[0]
		nameData[useNameAsKey ? value : name.arr.join('|')] = value
	}

	return nameData
}

TabDefine("search", function(reply, thenCall)
{
	var options = CreateOnlyShowSelectBox(reply, "RedrawSearchResults()", "Search within", "ALL")
	const nameData = SettingsGetMentionList("Custom")

	nameData["twent*|thirt*|forty|fortie*|fift*|eight*|one|ones|two*|three*|four*|five*|six*|seven*|nine*|ten|tens|tenth*|third*|fourth*|ninth*|eleven*|twelfth*|twelve*|hundred*|thousand*|billion*|million*|trillion*"] = "Numbers (words)"
	nameData["*[0-9]*"] = "Numbers (digits)"
	nameData["in fact|of course|in many ways|for some reason|some kind|no doubt|certainly|definitely"] = "&quot;In fact&quot;"
	nameData["entire|entirely|total|totally|utter|utterly|fully|complete|completely|whole|wholly|altogether|literal|literally|somewhat|quite|really|very"] = "&quot;Completely&quot;"
	nameData["beg*n* to|b*g*n* *ing|start* to|start* *ing|proceed* to|proceed* *ing|set about"] = "&quot;Started to&quot;"
	nameData["sudden*|instant*|immediate*"] = "&quot;Suddenly&quot;"
	nameData["stood up|stand* up|sat down|sit* down|lay* down|lie* down|lying down|jump* up|rais* up|ris* up|lift* up|gather* up|collect* up|print* out"] = "&quot;Sat down&quot;"
	
	OptionsMakeSelect(options, "RedrawSearchResults()", "Entity", "entity", nameData, "")
	OptionsMakeTextBox(options, "RedrawSearchResults()", "Search for", "custom")
	GraphCreateStandardOptions(options, "RedrawSearchResults", true)

	reply.push(OptionsConcat(options))
	GraphAddCanvas(reply, 250, thenCall)
	MakeUpdatingArea(reply, "searchResultsHere", 'align="left" style="user-select:text"')

	thenCall.push(RedrawSearchResults)
}, {icon:kIconSearch})

function HighlightThreadSection(num)
{
	StopTalking()

	if (num >= 0 && num < g_threadSections.length)
	{
		if (g_threadSectionSelected != num)
		{
			TrySetElementClass("threadSection" + g_threadSectionSelected, "highlighter", false)
		}

		g_threadSectionSelected = num

		const stashThis = TrySetElementClass("threadSection" + num, "highlighter", true)?.innerHTML

		if (stashThis)
		{
			g_recentlyHighlightedReadToMeText.unshift(stashThis)
			g_recentlyHighlightedReadToMeText.splice(4)
		}
	}

	return num == g_threadSectionSelected
}

function FindRecentLine(txt)
{
	for (var checkEmAll in g_threadSections)
	{
		if (document.getElementById("threadSection" + checkEmAll)?.innerHTML == txt)
		{
			g_threadSectionSelected = +checkEmAll
			return true
		}
	}

	return false
}

function RedrawThread(goToTop)
{
	var threadsGoHere = document.getElementById("threadsGoHere")

	g_threadSections = []
	g_threadSectionSelected = 0

	if (threadsGoHere)
	{
		var output = []
		var addWhenSkipASection = ""
		var skippedASection = true
		var lastChapterName

		const {page, headings, summary} = g_currentOptions.voice
		const showThis = g_currentOptions.voice["showThis_" + page]

		NovaLog("Redrawing sections where " + page + "='" + showThis + "' (" + (goToTop ? "jumping to top" : "searching for previously highlighted text") + ")")

		for (var metadata of g_metaDataInOrder)
		{
			const info = metadata.info
			const displayTheseThings = summary ? metadata.mySummaries : metadata.myParagraphs

			if (displayTheseThings.length && ((page == "ALL") || ((page == "MENTIONS") ? metadata.Mentions[showThis] : (info[page] == showThis))))
			{
				if (skippedASection)
				{
					output.push(addWhenSkipASection)
				}

				if (headings)
				{
					const thisChapterName = info.CHAPTER
					var headingText = MetaDataMakeFragmentDescription(metadata)

					if (lastChapterName != thisChapterName)
					{
						headingText = '<SPAN CLASS="clicky" ONCLICK="HighlightThreadSection(' + g_threadSections.length + ')" ID="threadSection' + g_threadSections.length + '">' + headingText + '</SPAN>'
						g_threadSections.push({sayThisText:thisChapterName})
						lastChapterName = thisChapterName
					}

					output.push("<H3>" + headingText + "</H3>")
				}
				else if (addWhenSkipASection)
				{
					output.push("<BR>")
				}

				for (var para of displayTheseThings)
				{
					FormatParagraphForDisplay(output, para.fragments, fragment =>
					{
						const theTxt = fragment.text + fragment.followedBy
						const reply = '<SPAN CLASS="clicky" ONCLICK="HighlightThreadSection(' + g_threadSections.length + ')" ID="threadSection' + g_threadSections.length + '">' + theTxt + '</SPAN>'
						g_threadSections.push({sayThisText:theTxt, useSpeechVoice:fragment.isSpeech})
						return reply
					})
					output.push("<BR>")
				}
				addWhenSkipASection = "<BR><HR WIDTH=45%>"
				skippedASection = false
			}
			else
			{
				skippedASection = true
			}
		}

		// Add a button which goes to next section if there is one!
		var addNext = false
		var nameData = {[""]:""}

		for (var {info} of g_metaDataInOrder)
		{
			if (page in info)
			{
				const txt = info[page]
				nameData[txt] = txt
			}
		}

		for (var txt of Object.keys(nameData))
		{
			if (txt)
			{
				if (addNext)
				{
					const escapedText = txt.replaceAll("'", "\\'")
	//				console.log("Escaped: " + escapedText)
					output.push('<P ALIGN=right STYLE="padding-right:20px"><BUTTON ID=nextChunk ONCLICK="' + AddEscapeChars('window.scrollTo(0,0); document.getElementById(\'voice.showThis_' + page + '\').value = \'' + escapedText + '\'; UpdateOptions(); RedrawThread(true)') + '">Next: ' + txt + '</BUTTON></p>')
					break
				}
				else if (txt == showThis)
				{
					addNext = true
				}
			}
		}
		threadsGoHere.innerHTML = output.join('')
	}

	if (goToTop)
	{
		g_recentlyHighlightedReadToMeText = []
	}
	else
	{
		for (var checkRecentLines of g_recentlyHighlightedReadToMeText)
		{
			if (FindRecentLine(checkRecentLines))
			{
				break
			}
		}
	}

	HighlightThreadSection(g_threadSectionSelected)
}

function OnDoneThreadSpeakingFragment()
{
	if (HighlightThreadSection(g_threadSectionSelected + 1))
	{
		CallTheseFunctions(ThreadRead)
	}
	else if (g_currentOptions.voice.autoAdvance)
	{
		var nextChunkButton = document.getElementById("nextChunk")

		if (nextChunkButton)
		{
			nextChunkButton.click()
			CallTheseFunctions(ThreadRead)
		}
	}
}

function ThreadRead()
{
	const thingToSay = g_threadSections[g_threadSectionSelected]

	if (thingToSay)
	{
		// Scroll to element...
		const theElement = document.getElementById("threadSection" + g_threadSectionSelected)

		if (theElement)
		{
			const rect = theElement.getBoundingClientRect()

			if (rect.bottom > window.innerHeight * 0.8 || rect.top < window.innerHeight * 0.2)
			{
				window.scrollTo(0, rect.top + window.scrollY - window.innerHeight * 0.3)
			}
		}

		SpeakUsingVoice(thingToSay.sayThisText, thingToSay.useSpeechVoice ? "voiceSpeech" : "voiceDefault", OnDoneThreadSpeakingFragment)
	}
}

function CreateOnlyShowSelectBox(reply, callThis, prefix, theDefault)
{
	var options = []
	var columns = Object.keys(g_metaDataAvailableColumns)
	columns.push("MENTIONS", "ALL")
	TabBuildButtonsBar(reply, columns, theDefault)

	if (g_hasSummaries == undefined)
	{
		g_hasSummaries = false
		for (var {mySummaries} of g_metaDataInOrder)
		{
			if (mySummaries.length)
			{
				g_hasSummaries = true
				break
			}
		}
	}

	const page = g_currentOptions[g_selectedTabName].page

	if (page == "MENTIONS")
	{
		const mentionData = SettingsGetMentionList(undefined, true)
		OptionsMakeSelect(options, callThis, prefix + " sections which mention", "showThis_" + page, mentionData, undefined, true)
	}
	else if (page != "ALL")
	{
		var nameData = {}
		for (var {info} of g_metaDataInOrder)
		{
			if (page in info)
			{
				const txt = info[page]
				nameData[txt] = txt
			}
		}

		OptionsMakeSelect(options, callThis, prefix + " " + page.toLowerCase(), "showThis_" + page, nameData, undefined, true)
	}
	
	return options
}

TabDefine("voice", function(reply, thenCall)
{
	var options = CreateOnlyShowSelectBox(reply, "RedrawThread()", "Show")
	OptionsMakeCheckbox(options, "RedrawThread()", "headings", "Show headings", true, true)

	if (g_hasSummaries)
	{
		OptionsMakeCheckbox(options, "RedrawThread(true)", "summary", "Show summary", false, true)
	}

	OptionsMakeCheckbox(options, null, "autoAdvance", "Auto-advance", true)
	OptionsMakeCheckbox(options, null, "onlyReadSpeech", "Only read speech", false)
	reply.push(OptionsConcat(options))
	MakeUpdatingArea(reply, "threadsGoHere", 'align="left" style="user-select:text"')

	var hoverOptions = []
	hoverOptions.push('<BUTTON ONCLICK="ThreadRead()">' + MakeIconWithTooltip(kIconSpeech, -15, "Speak", undefined, undefined, undefined, undefined, "175%") + '</BUTTON>')
	hoverOptions.push('<BUTTON ONCLICK="StopTalking()">' + MakeIconWithTooltip(kIconMute, -4, "Stop", undefined, undefined, undefined, undefined, "175%") + '</BUTTON>')
	ShowHoverControls(hoverOptions)

	thenCall.push(RedrawThread)
}, {icon:kIconOpenBook, tooltipText:"Read to me"})

//---------------------------------------
// Switch to here from another tab
//---------------------------------------

function SwitchToMentionsAndSearchEntity(txt)
{
	const specificNames = SettingsGetNamesArrays()
	for (var name of specificNames)
	{
		if (txt == name.arr[0])
		{
			const searchFor = name.arr.join('|')
			OptionsMakeKey("search", "entity", searchFor, true)
			OptionsMakeKey("search", "custom", searchFor, true)
			ShowTab("search")
			return
		}
		else if (txt.toUpperCase() == name.arr[0].toUpperCase())
		{
			NovaWarn("Suspicious! Text in '" + txt + "' NEARLY matches '" + name.arr[0] + "'")
		}
	}
	ShowError("SwitchToMentionsAndSearchEntity failed to find '" + txt + "'")
}

function SwitchToMentionsAndSearch(txt)
{
	OptionsMakeKey("search", "entity", "", true)
	OptionsMakeKey("search", "custom", txt, true)
	ShowTab("search")
}

function SwitchToReadToMe(page, whichOne)
{
	OptionsMakeKey("voice", "page", page, true)
	OptionsMakeKey("voice", "showThis_" + page, whichOne, true)
	ShowTab("voice")
}

function OpenThesaurus(word)
{
	window.open('https://www.thesaurus.com/browse/' + word, 'nova_thesaurus_' + word, 'width=600,height=800,menubar=no,toolbar=no')
}

function MakeMentionLink(showText, searchForText)
{
	const paramsString = MakeParamsString(searchForText ?? showText)
	const reply = [showText]
	reply.push('&nbsp;')
	reply.push(CreateClickableText(kIconSearch, "SwitchToMentionsAndSearch(" + paramsString + ")"))
	reply.push(CreateClickableText(kIconThesaurus, "OpenThesaurus(" + paramsString + ")"))
	return reply.join('')
}