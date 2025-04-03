//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2025
//==============================================

var g_threadSections = []
var g_searchDataForGraph = {colours:{}, data:{}}
var g_threadSectionSelected = 0
var g_recentlyHighlightedReadToMeText = []

const kMatchModes =
{
	"Phrase contains":   {before:"\\b", after:"\\b", flags:"ig"},
	"Phrase starts with":{before:"^",   after:"\\b", flags:"i"},
	"Phrase ends with":  {before:"\\b", after:"$",   flags:"i"},
	"Phrase equals":     {before:"^",   after:"$",   flags:"i"},
}

function TurnRedIf(input, condition)
{
	return condition ? "<FONT COLOR=Red>" + input + "</FONT>" : input
}

function RedrawSearchResults()
{
	var searchResultsHere = document.getElementById("searchResultsHere")
	var customTextBox = document.getElementById("search.custom")

	CancelPendingFunctions()
	
	g_searchTableCachedData = {}

	if (searchResultsHere && customTextBox)
	{
		var displayThis = "<center><B>No results found</B></center>"
		var graphVisible = false
		var entityNames = document.getElementById("search.entity")?.value

		g_searchDataForGraph = {clickData:{clickList:[], timerCancelWhen:[RedrawSearchResults, ShowContentForSelectedTab]}, colours:{}, data:[], doStripes:true}

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

		const {onlyShow, colourUsing, matchMode} = g_currentOptions.search
		
		Assert(matchMode in kMatchModes, "Bad match mode '" + matchMode + "'")

		const {before, after, flags} = kMatchModes[matchMode]
		const showThis = g_currentOptions.search["showThis_" + onlyShow]
		const bgData = g_metaDataSeenValues[colourUsing]

		if (bgData)
		{
			g_searchDataForGraph.backgroundBlocks = []
		}

		if (entityNames && g_metaDataInOrder.length)
		{
			var output = []
			var anchorCount = 0

			const matchThis = new RegExp(before + "(?:" + TurnNovaShorthandIntoRegex(entityNames) + ")" + after, flags)

			for (var metadata of g_metaDataInOrder)
			{
				const info = metadata.info

				if (((onlyShow == "ALL") || ((onlyShow == "MENTIONS") ? metadata.Mentions[showThis] : (info[onlyShow] == showThis))))
				{
					const useColour = info[colourUsing]

					GraphAddBackgroundBlock(g_searchDataForGraph, metadata.Paragraphs, useColour)

					var addAfterSkippedLines = "<H3 recolourHeading=\"" + useColour + "\">" + MetaDataMakeFragmentDescription(metadata) + "</H3>"
					var keepShowingCountdown = 0
					var showThisToo = null
					var skippedLines = true

					for (var {ignoreFragments, fragments, issues} of metadata.myParagraphs)
					{
						if (! ignoreFragments)
						{
							function GotAMatch(matched)
							{
								const upper = matched.toUpperCase()
								Tally(g_searchTableCachedData, upper)
								Tally(grabForPara, upper)
								return Highlighter(matched, undefined, 'highlightFor="' + upper + '"')
							}

							var grabForPara = {}
							var s2 = FormatParagraphForDisplay(fragments, fragment => fragment.text.replace(matchThis, GotAMatch) + fragment.followedBy)

							const plain = FormatParagraphForDisplay(fragments, fragment => fragment.text + fragment.followedBy)
							const foundTextHere = (plain != s2)

							g_searchDataForGraph.data.push(grabForPara)

							if (foundTextHere || keepShowingCountdown)
							{
								var prefix = ""

								if (foundTextHere)
								{
									keepShowingCountdown = 1
									s2 = '<FONT ID="searchAnchor' + anchorCount + '">' + s2 + '</FONT>'
									g_searchDataForGraph.clickData.clickList.push({elemName:'searchAnchor' + anchorCount, clickX:g_searchDataForGraph.data.length - 1})
									++ anchorCount
								}
								else
								{
									-- keepShowingCountdown
								}

								if (skippedLines)
								{
									prefix = addAfterSkippedLines
									skippedLines = false
									addAfterSkippedLines = "<br>"
								}

								if (showThisToo)
								{
									output.push(prefix + '<DIV CLASS="indent">' + showThisToo + '</DIV>')
									prefix = ""
								}

								output.push(prefix + '<DIV CLASS="indent">' + TurnRedIf(s2, issues) + '</DIV>')
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
				const upperKeys = Object.keys(g_searchTableCachedData)
				const colours = MakeColourLookUpTable(upperKeys, 0.3, PickColourOffsetForString(entityNames))

				var realOutput = []
				var recolour = []

				g_searchDataForGraph.colours = colours

				for (var key of upperKeys)
				{
					recolour.push(['highlightFor="' + key + '"', 'style="background-color:' + g_searchDataForGraph.colours[key] + '"'])
				}

				if (g_searchDataForGraph.backgroundBlocks)
				{
					CreateGraphBackgroundColours(g_searchDataForGraph)

					for (var [key, value] of Object.entries(g_searchDataForGraph.bgColours))
					{
						recolour.push(['recolourHeading="' + key + '"', 'style="color:white; background-color:' + value + '"'])
					}
				}

//				console.log("Recolouring using:\n  " + recolour.join('\n  '))

				for (var eachLine of output)
				{
					for (var [searchFor, becomes] of recolour)
					{
						eachLine = eachLine.replaceAll(searchFor, becomes)
					}
					realOutput.push(eachLine)
				}

				const tableSettings = {ignoreWhenThisLow:1, showMoreFunc:"ExpandSearchTable()", addSearchIcon:true, matchMode:matchMode, colours:g_searchDataForGraph.colours, showTotal:true}
				displayThis = "<center id=searchTable>" + TableShowTally(g_searchTableCachedData, tableSettings) + "</center>" + realOutput.join('')
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

function ExpandSearchTable()
{
	const tableSettings = {addSearchIcon:true, matchMode:g_currentOptions.search.matchMode, colours:g_searchDataForGraph.colours, showTotal:true}
	TrySetElementContents("searchTable", TableShowTally(g_searchTableCachedData, tableSettings))
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
	nameData["in fact|of course|in many ways|for some reason|some kind|no doubt|certainly|definitely|all honesty|* be honest|whatsoever|more accurately|after all|at all|in the slightest|by any means"] = "&quot;In fact&quot;"
	nameData["entire|entirely|total|totally|utter|utterly|fully|complete|completely|whole|wholly|altogether|literal|literally|incredibly|especially|really|very|ever so"] = "&quot;Completely&quot;"
	nameData["somewhat|quite|slightly|a bit|a little|a * bit|an * bit|a * little|an * little|fractionally"] = "&quot;Somewhat&quot;"
	nameData["beg*n* to|b*g*n* *ing|start* to|start* *ing|proceed* to|proceed* *ing|set about"] = "&quot;Started to&quot;"
	nameData["sudden*|instant*|immediate*"] = "&quot;Suddenly&quot;"
	nameData["in spite|in the process|in the event|with regard*|with the exception|with the * exception|about as|as to|for the purpose"] = "&quot;In/with/as/for&quot;"
	nameData["stood up|stand* up|sat down|sit* down|lay* down|lie* down|lying down|jump* up|rais* up|ris* up|though about|think* about|lift* up|gather* up|pass* by|collect* up|print* out|knelt down|kneel* down|start* out"] = "&quot;Sat down&quot;"

	OptionsMakeSelect(options, "RedrawSearchResults()", "Search for", "entity", nameData, "")
	OptionsMakeTextBox(options, "RedrawSearchResults()", "", "custom")
	options.push("|")
	OptionsMakeSelect(options, "RedrawSearchResults()", "Match mode", "matchMode", Object.keys(kMatchModes), undefined, true)
	GraphCreateStandardOptions(options, "RedrawSearchResults", true, g_currentOptions.search.onlyShow)

	reply.push(OptionsConcat(options))
	GraphAddCanvas(reply, 250, thenCall, false)
	reply.push("<BR>")
	MakeUpdatingArea(reply, "searchResultsHere", 'align="left" style="user-select:text"', "<center><B>No results found</B></center>")

	thenCall.push(RedrawSearchResults)
}, {icon:kIconSearch})

function HighlightThreadSection(num)
{
	StopTalking()

	if (g_threadSectionSelected != num)
	{
		TrySetElementClass("threadSection" + g_threadSectionSelected, "highlighter", false)
	}

	g_threadSectionSelected = num

	if (num >= 0 && num < g_threadSections.length)
	{
		const stashThis = TrySetElementClass("threadSection" + num, "highlighter", true)?.innerHTML

		if (stashThis)
		{
			g_recentlyHighlightedReadToMeText.unshift(stashThis)
			g_recentlyHighlightedReadToMeText.splice(4)
		}
	}
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
	StopTalking()
	var threadsGoHere = document.getElementById("threadsGoHere")

	g_threadSections = []
	g_threadSectionSelected = 0

	if (threadsGoHere)
	{
		var output = []
		var addWhenSkipASection = ""
		var skippedASection = true
		var lastChapterName

		const {onlyShow, headings, summary} = g_currentOptions.voice
		const showThis = g_currentOptions.voice["showThis_" + onlyShow]

		NovaLog("Redrawing sections where " + onlyShow + "='" + showThis + "' (" + (goToTop ? "jumping to top" : "searching for previously highlighted text") + ")")

		for (var metadata of g_metaDataInOrder)
		{
			const info = metadata.info
			const displayTheseThings = summary ? metadata.mySummaries : metadata.myParagraphs

			if (displayTheseThings.length && ((onlyShow == "ALL") || ((onlyShow == "MENTIONS") ? metadata.Mentions[showThis] : (info[onlyShow] == showThis))))
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
				else
				{
					output.push("<BR>")
				}

				for (var {issues, fragments} of displayTheseThings)
				{
					var after = ""

					if (issues)
					{
						output.push("<FONT COLOR=red>")
						after = "</FONT>"
					}

					const formatted = FormatParagraphForDisplay(fragments, fragment =>
					{
						const followedBy = fragment.followedBy.replace(/ \($/, '')
						const theTxt = fragment.text + followedBy
						const reply = '<SPAN CLASS="clicky" ONCLICK="HighlightThreadSection(' + g_threadSections.length + ')" ID="threadSection' + g_threadSections.length + '">' + theTxt + '</SPAN>'
						g_threadSections.push({sayThisText:theTxt, useSpeechVoice:fragment.isSpeech})

						if (followedBy != fragment.followedBy)
						{
							return reply + " ("
						}

						return reply
					})

					output.push('<DIV CLASS="indent">', formatted, '</DIV>', after)
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
			if (onlyShow in info)
			{
				const txt = info[onlyShow]
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
					output.push('<P ALIGN=right STYLE="padding-right:20px"><BUTTON ID=nextChunk ONCLICK="' + AddEscapeChars('window.scrollTo(0,0); document.getElementById(\'voice.showThis_' + onlyShow + '\').value = \'' + escapedText + '\'; UpdateOptions(); RedrawThread(true)') + '">Next: ' + txt + '</BUTTON></p>')
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
	HighlightThreadSection(g_threadSectionSelected + 1)
	ThreadRead()
}

function ThreadRead()
{
	const thingToSay = g_threadSections[g_threadSectionSelected]

	if (thingToSay)
	{
		if (g_currentOptions.voice.onlyReadSpeech && !thingToSay.useSpeechVoice)
		{
			CallTheseFunctions(OnDoneThreadSpeakingFragment)
		}
		else
		{
			ScrollToElementId("threadSection" + g_threadSectionSelected)
			SpeakUsingVoice(thingToSay.sayThisText, thingToSay.useSpeechVoice ? "voiceSpeech" : "voiceDefault", OnDoneThreadSpeakingFragment)
		}
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

function CreateOnlyShowSelectBox(reply, callThis, prefix, theDefault)
{
	var options = []
	var columns = {}

	Object.keys(g_metaDataAvailableColumns).forEach(eachCol => columns[eachCol] = CapitaliseFirstLetter(eachCol.toLowerCase()))

	columns["MENTIONS"] = "Sections that mention"
	columns["ALL"] = "All text"

	OptionsMakeSelect(options, "ShowContentForSelectedTab()", prefix, "onlyShow", columns, theDefault, true)

	const onlyShow = g_currentOptions[g_selectedTabName].onlyShow

	if (onlyShow == "MENTIONS")
	{
		const mentionData = SettingsGetMentionList(undefined, true)
		OptionsMakeSelect(options, callThis, "", "showThis_" + onlyShow, mentionData, undefined, true)
	}
	else if (onlyShow != "ALL")
	{
		var nameData = {}
		for (var {info} of g_metaDataInOrder)
		{
			if (onlyShow in info)
			{
				const txt = info[onlyShow]
				nameData[txt] = txt
			}
		}

		OptionsMakeSelect(options, callThis, "", "showThis_" + onlyShow, nameData, undefined, true)
	}

	options.push("|")
	return options
}

TabDefine("voice", function(reply, thenCall)
{
	var options = CreateOnlyShowSelectBox(reply, "RedrawThread()", "Show")
	OptionsMakeCheckbox(options, "RedrawThread()", "headings", "Show headings", true)

	if (g_hasSummaries)
	{
		OptionsMakeCheckbox(options, "RedrawThread(true)", "summary", "Show summary", false)
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

			NovaLog("Searching for entity '" + searchFor + "' (matchMode=" + matchMode + ")")
			
			OptionsMakeKey("search", "matchMode", "Phrase contains", true)
			OptionsMakeKey("search", "onlyShow", "ALL", true)
			OptionsMakeKey("search", "entity", searchFor, true)
			OptionsMakeKey("search", "custom", searchFor, true)
			ShowTab("search")
			return
		}
		/*
		else if (txt.toUpperCase() == name.arr[0].toUpperCase())
		{
			NovaWarn("Suspicious! Text in '" + txt + "' NEARLY matches '" + name.arr[0] + "'")
		}
		*/
	}
	ShowError("SwitchToMentionsAndSearchEntity failed to find '" + txt + "'")
}

function SwitchToMentionsAndSearch(txt, matchMode)
{
	NovaLog("Searching for custom text '" + txt + "' (matchMode=" + matchMode + ")")

	OptionsMakeKey("search", "matchMode", matchMode ?? "Phrase contains", true)
	OptionsMakeKey("search", "onlyShow", "ALL", true)
	OptionsMakeKey("search", "entity", "", true)
	OptionsMakeKey("search", "custom", txt, true)

	ShowTab("search")
}

function SwitchToReadToMe(onlyShow, whichOne)
{
	OptionsMakeKey("voice", "onlyShow", onlyShow, true)
	OptionsMakeKey("voice", "showThis_" + onlyShow, whichOne, true)
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