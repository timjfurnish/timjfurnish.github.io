//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_threadSections = []
var g_threadSectionSelected = 0
var g_threadSectionFragment = 0

const kIndent = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"

function TurnRedIf(input, condition)
{
	return condition ? "<FONT COLOR=Red>" + input + "</FONT>" : input
}

function RedrawSearchResults()
{
	var searchResultsHere = document.getElementById("searchResultsHere")
	var customTextBox = document.getElementById("search.custom")

	var lastHeading = ""

	if (searchResultsHere && customTextBox)
	{
		var displayThis = "<center><B>No results found</B></center>"
		var entityNames = document.getElementById("search.entity")?.value

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

			NovaLog("Searching for " + theString)

			for (var metadata of g_metaDataInOrder)
			{
				var addAfterSkippedLines = "<H3>" + MetaDataMakeFragmentDescription(metadata.info) + "</H3>"
				var keepShowingCountdown = 0
				var showThisToo = null
				var skippedLines = true

				for (var para of metadata.myParagraphs)
				{
					if (! para.ignoreFragments)
					{
						var s2 = para.allOfIt.replace(exp, matched => Tally(grabEmHere, matched) && Highlighter(matched))
						const foundTextHere = (para.allOfIt != s2)
						
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
				console.log(grabEmHere)
				displayThis = "<center>" + TableShowTally(grabEmHere) + "</center>" + output.join('<BR>')
			}
		}

		searchResultsHere.innerHTML = displayThis
	}
}

TabDefine("search", function(reply, thenCall)
{
	const specificNames = SettingsGetNamesArrays()
	var nameData = {[""]:"Custom"}

	for (var name of specificNames)
	{
		nameData[name.arr.join('|')] = CapitaliseFirstLetter(name.arr[0])
	}
	
	var options = []
	OptionsMakeSelect(options, "RedrawSearchResults()", "Entity", "entity", nameData, "")
	OptionsMakeTextBox(options, "RedrawSearchResults()", "Search for", "custom")
	reply.push(OptionsConcat(options))
	MakeUpdatingArea(reply, "searchResultsHere", 'align="left"')
	
	thenCall.push(RedrawSearchResults)
}, kIconSearch)

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

	var lastHeading = ""
	
	g_threadSections = []
	g_threadSectionSelected = 0

	if (threadsGoHere)
	{
		var output = []
		var mustMatch = g_currentOptions.voice.showThis

		for (var metadata of g_metaDataInOrder)
		{
			var showHeading = "<H3>" + MetaDataMakeFragmentDescription(metadata.info) + "</H3>"
			var before = ""
			
			if (metadata.info[g_currentOptions.voice.page] == mustMatch)
			{
				for (var para of metadata.myParagraphs)
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
		const fragment = thingToSay.fragments[g_threadSectionFragment]
		if (fragment)
		{
			SpeakUsingVoice(fragment.text + fragment.followedBy, fragment.isSpeech ? "voiceSpeech" : "voiceDefault", OnDoneThreadSpeakingFragment)
		}
		else if (HighlightThreadSection(g_threadSectionSelected + 1, true))
		{
			CallTheseFunctions(ThreadRead)
		}
	}
}

TabDefine("voice", function(reply, thenCall)
{
	const columns = Object.keys(g_metaDataAvailableColumns)
	
	if (columns.length)
	{
		TabBuildButtonsBar(reply, columns)
		
		var nameData = {[""]:""}

		for (var metadata of g_metaDataInOrder)
		{
			const txt = metadata.info[g_currentOptions.voice.page]
			nameData[txt] = txt
		}
		
		var options = []
		var hoverOptions = []
		OptionsMakeSelect(options, "RedrawThread()", "Only show text from " + g_currentOptions.voice.page.toLowerCase(), "showThis", nameData, "", true)
//		hoverOptions.push('<button onclick="HighlightThreadSection(g_threadSectionSelected - 1, true)">&lt;</button>')
//		hoverOptions.push('<button onclick="HighlightThreadSection(g_threadSectionSelected + 1, true)">&gt;</button>')
		hoverOptions.push('<BUTTON ONCLICK="ThreadRead()">' + MakeIconWithTooltip(kIconSpeech, -15, "Speak") + '</BUTTON>')
		hoverOptions.push('<BUTTON ONCLICK="speechSynthesis.cancel()">' + MakeIconWithTooltip(kIconMute, -4, "Stop") + '</BUTTON>')
		hoverOptions.push('<BUTTON ONCLICK="window.scrollTo(0,0)">' + MakeIconWithTooltip(kIconToTop, 20, "Scroll to top") + '</BUTTON>')

		reply.push(OptionsConcat(options))
		MakeUpdatingArea(reply, "threadsGoHere", 'align="left"')
		
		ShowHoverControls(hoverOptions)
		
		thenCall.push(RedrawThread)
	}
}, kIconBooks, "Read")

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