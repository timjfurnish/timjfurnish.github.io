//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_threadSections = []
var g_searchDataForGraph = {colours:{}, data:{}}
var g_threadSectionSelected = 0
var g_threadSectionFragment = 0

const kIndent = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"

function TurnRedIf(input, condition)
{
	return condition ? "<FONT COLOR=Red>" + input + "</FONT>" : input
}

function RedrawSearchResults()
{
	const gapValue = +g_currentOptions.search.smoothing * 4 + 2
	const compress = g_currentOptions.search.compress

	var searchResultsHere = document.getElementById("searchResultsHere")
	var customTextBox = document.getElementById("search.custom")
	var countdownUntilNoAdd = gapValue

	if (searchResultsHere && customTextBox)
	{
		var displayThis = "<center><B>No results found</B></center>"
		var graphVisible = false
		var entityNames = document.getElementById("search.entity")?.value
		
		g_searchDataForGraph = {colours:{}, data:[]}

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

		if (entityNames && g_metaDataInOrder.length)
		{
			var output = []
			var grabEmHere = {}
			const theString = "\\b(?:" + TurnNovaShorthandIntoRegex(entityNames) + ")\\b"
			const exp = new RegExp(theString, "ig");

			for (var metadata of g_metaDataInOrder)
			{
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

						if (foundTextHere)
						{
							countdownUntilNoAdd = gapValue
						}
						else if (countdownUntilNoAdd && compress)
						{
							-- countdownUntilNoAdd
						}
						
						if (countdownUntilNoAdd)
						{
							g_searchDataForGraph.data.push(grabForPara)
						}
						
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

				displayThis = "<center>" + TableShowTally(grabEmHere, {colours:g_searchDataForGraph.colours, showTotal:true}) + "</center>" + realOutput.join('<BR>')
				graphVisible = true
			}
		}
		
		searchResultsHere.innerHTML = displayThis
		
		const graph = document.getElementById("graphCanvas")
		if (graph)
		{
			if (graphVisible)
			{
				graph.style.display = "block"
				SearchDrawGraph()
			}
			else
			{
				graph.style.display = "none"
			}
		}
	}
}

function SettingsGetMentionList(firstElementText, useNameAsKey)
{
	const specificNames = SettingsGetNamesArrays()
	var nameData = {[""]:firstElementText}

	for (var name of specificNames)
	{
		const value = name.arr[0]
		nameData[useNameAsKey ? value : name.arr.join('|')] = value
	}
	
	return nameData
}

TabDefine("search", function(reply, thenCall)
{
	const nameData = SettingsGetMentionList("Custom")

	var options = []
	OptionsMakeSelect(options, "RedrawSearchResults()", "Entity", "entity", nameData, "")
	OptionsMakeTextBox(options, "RedrawSearchResults()", "Search for", "custom")
	OptionsMakeCheckbox(options, "RedrawSearchResults()", "compress", "Compress empty areas", false, true)
	GraphCreateStandardOptions(options, "SearchDrawGraph", true)

	reply.push(OptionsConcat(options))
	reply.push("<BR><CANVAS WIDTH=" + CalcGraphCanvasWidth() + " HEIGHT=200 ID=graphCanvas></CANVAS>")
	MakeUpdatingArea(reply, "searchResultsHere", 'align="left" style="user-select:text"')
	
	thenCall.push(RedrawSearchResults)
}, {icon:kIconSearch})

function SearchDrawGraph()
{
	DrawSmoothedGraph(g_searchDataForGraph, +g_currentOptions.search.smoothing, g_currentOptions.search.compress ? undefined : {colourUsing:g_currentOptions.search.colourUsing})
}

function HighlightThreadSection(num, bCanScroll)
{
	speechSynthesis.cancel()
	
	if (num >= 0 && num < g_threadSections.length)
	{
		if (g_threadSectionSelected != num)
		{
			TrySetElementClass("threadSection" + g_threadSectionSelected, "highlighter", false)
		}

		g_threadSectionSelected = num
		g_threadSectionFragment = 0
		const theElement = TrySetElementClass("threadSection" + num, "highlighter", true)
		
		if (theElement && bCanScroll)
		{
			const rect = theElement.getBoundingClientRect()
			
			if (rect.bottom > window.innerHeight * 0.8)
			{
				window.scrollTo(0, rect.top + window.scrollY - window.innerHeight * 0.2)
			}
			else if (rect.top < window.innerHeight * 0.2)
			{
				window.scrollTo(0, rect.bottom + window.scrollY - window.innerHeight * 0.8)
			}
		}
	}
	
//	SetTabTitle('voice', g_threadSectionSelected)
	
	return num == g_threadSectionSelected
}

function RedrawThread()
{
	var threadsGoHere = document.getElementById("threadsGoHere")
	
	g_threadSections = []
	g_threadSectionSelected = 0

	if (threadsGoHere)
	{
		var output = []
		var addWhenSkipASection = ""
		var skippedASection = false

		const {page, headings, summary} = g_currentOptions.voice
		const showThis = g_currentOptions.voice["showThis_" + page]
		
		if (showThis || page == "ALL")
		{
			NovaLog("Redrawing sections where " + page + "='" + showThis + "'")

			for (var metadata of g_metaDataInOrder)
			{
				const info = metadata.info
				var showHeading = (skippedASection ? addWhenSkipASection : "") + (headings ? "<H3>" + MetaDataMakeFragmentDescription(metadata) + "</H3>" : addWhenSkipASection ? "<BR>" : "")
				var before = ""

				const matches = (page == "ALL") || ((page == "MENTIONS") ? metadata.Mentions[showThis] : (info[page] == showThis))

				if (matches)
				{
					for (var para of summary ? metadata.mySummaries : metadata.myParagraphs)
					{
						if (showHeading)
						{
							before = showHeading
							showHeading = false
						}

						output.push(before + kIndent + '<SPAN CLASS="clicky" ONCLICK="HighlightThreadSection(' + g_threadSections.length + ')" ID="threadSection' + g_threadSections.length + '">' + TurnRedIf(para.allOfIt, para.issues) + '</SPAN>')
						g_threadSections.push(para)
						
						before = ""
					}

					addWhenSkipASection = "<BR><HR WIDTH=45%>"
				}
				
				skippedASection = !matches
			}
		}

		threadsGoHere.innerHTML = output.join('<BR>')
	}
	
	HighlightThreadSection(g_threadSectionSelected)
}

function OnDoneThreadSpeakingFragment()
{
	++ g_threadSectionFragment
	ThreadRead()
}

function ThreadRead()
{
	const thingToSay = g_threadSections[g_threadSectionSelected]
	if (thingToSay)
	{
		if (thingToSay.fragments)
		{
			// When reading actual text
			const fragment = thingToSay.fragments[g_threadSectionFragment]
			if (fragment)
			{
				SpeakUsingVoice(fragment.text + fragment.followedBy, fragment.isSpeech ? "voiceSpeech" : "voiceDefault", OnDoneThreadSpeakingFragment)
				return
			}
		}
		else if (g_threadSectionFragment == 0)
		{
			// When reading summaries
			SpeakUsingVoice(thingToSay.allOfIt, "voiceDefault", OnDoneThreadSpeakingFragment)
			return
		}

		if (HighlightThreadSection(g_threadSectionSelected + 1, true))
		{
			CallTheseFunctions(ThreadRead)
		}
	}
}

TabDefine("voice", function(reply, thenCall)
{
	var columns = Object.keys(g_metaDataAvailableColumns)
	columns.push("MENTIONS", "ALL")

	TabBuildButtonsBar(reply, columns)

	const page = g_currentOptions.voice.page

	var options = []
	
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
		
		NovaLog("Does document have any summaries? " + (g_hasSummaries ? "Yes" : "No"))
	}
	
	if (page == "MENTIONS")
	{
		const mentionData = SettingsGetMentionList("", true)
		OptionsMakeSelect(options, "RedrawThread()", "Only show sections which mention", "showThis_" + page, mentionData, "", true)		
	}
	else if (page != "ALL")
	{
		var nameData = {[""]:""}

		for (var {info} of g_metaDataInOrder)
		{
			if (page in info)
			{
				const txt = info[page]
				nameData[txt] = txt
			}
		}
	
		OptionsMakeSelect(options, "RedrawThread()", "Only show text from " + page.toLowerCase(), "showThis_" + page, nameData, "", true)
	}

	OptionsMakeCheckbox(options, "RedrawThread()", "headings", "Show headings", true, true)
	
	if (g_hasSummaries)
	{
		OptionsMakeCheckbox(options, "RedrawThread()", "summary", "Show summary", false, true)
	}

	reply.push(OptionsConcat(options))

	MakeUpdatingArea(reply, "threadsGoHere", 'align="left" style="user-select:text"')
	
	var hoverOptions = []
	hoverOptions.push('<BUTTON ONCLICK="ThreadRead()">' + MakeIconWithTooltip(kIconSpeech, -15, "Speak") + '</BUTTON>')
	hoverOptions.push('<BUTTON ONCLICK="speechSynthesis.cancel()">' + MakeIconWithTooltip(kIconMute, -4, "Stop") + '</BUTTON>')
	ShowHoverControls(hoverOptions)
	
	thenCall.push(RedrawThread)
}, {icon:kIconBooks, tooltipText:"Read"})

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

function MakeMentionLink(showText, searchForText)
{
	return showText + '&nbsp;' + CreateClickableText(kIconSearch, "SwitchToMentionsAndSearch(" + MakeParamsString(searchForText ?? showText) + ")")
}